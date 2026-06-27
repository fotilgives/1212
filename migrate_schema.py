#!/usr/bin/env python3
"""
Generate base schema SQL from old project OpenAPI, then run it on new project.
Then re-run all migrations.
"""
import json, re, subprocess, sys, time

OLD_URL   = "https://ewtybyrtdvhibdtdvrmq.supabase.co"
OLD_SVC   = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
             ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dHlieXJ0ZHZoaWJkdGR2cm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ3Mjk4NywiZXhwIjoyMDkxMDQ4OTg3fQ"
             ".k3yDUh7GU1kGKKqK5H_UkRKUEr2_uUrRwJSZrw_uVfY")
NEW_PROJECT = "udptbbtlersuxumbpplb"
NEW_TOKEN   = "sbp_a39e1c2f29b88d2e5390e5da88c64fff3b28168c"
MIGRATIONS_DIR = "supabase/migrations"

# Tables created inside our migration files (skip in base schema)
CREATED_IN_MIGRATIONS = {
    "rps_config", "rps_prizes", "rps_reviews", "rps_admin_sessions",
    "rps_tournaments", "rps_tournament_invites",
}

FORMAT_TO_PG = {
    "uuid": "uuid",
    "text": "text",
    "integer": "integer",
    "bigint": "bigint",
    "boolean": "boolean",
    "timestamp with time zone": "timestamptz",
    "timestamp without time zone": "timestamp",
    "jsonb": "jsonb",
    "json": "json",
    "real": "real",
    "double precision": "double precision",
    "numeric": "numeric",
    "date": "date",
    "time without time zone": "time",
    "character varying": "text",
    "name": "text",
}


def curl_get(url, headers):
    cmd = ["curl", "-s", url]
    for k, v in headers.items():
        cmd += ["-H", f"{k}: {v}"]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return json.loads(r.stdout)


def curl_post_sql(project, token, sql):
    payload = json.dumps({"query": sql})
    r = subprocess.run(
        ["curl", "-s", "-L", "-X", "POST",
         f"https://api.supabase.com/v1/projects/{project}/database/query",
         "-H", f"Authorization: Bearer {token}",
         "-H", "Content-Type: application/json",
         "--data-binary", payload],
        capture_output=True, text=True, timeout=60,
    )
    out = r.stdout.strip()
    return out


def is_pk(col_props):
    desc = col_props.get("description", "")
    return "Primary Key" in desc


def has_fk(col_props):
    desc = col_props.get("description", "")
    m = re.search(r"<fk table='(\w+)' column='(\w+)'", desc)
    return m.groups() if m else None


def is_sql_expr(val):
    if not isinstance(val, str):
        return False
    val_lower = val.lower()
    return (
        "now()" in val_lower or
        "gen_random_uuid()" in val_lower or
        val_lower.startswith("timezone(")
    )


def pg_type(name, props, required_cols, is_primary):
    fmt = props.get("format", "text")
    pg = FORMAT_TO_PG.get(fmt, "text")
    default = props.get("default")
    not_null = name in required_cols

    col_def = f"{name} {pg}"

    if is_primary:
        if pg == "uuid":
            col_def += " PRIMARY KEY DEFAULT gen_random_uuid()"
        elif pg in ("integer", "bigint"):
            col_def = f"{name} bigserial PRIMARY KEY"
        else:
            col_def += " PRIMARY KEY"
        return col_def

    if not_null:
        if default is not None:
            if isinstance(default, bool):
                col_def += f" NOT NULL DEFAULT {'true' if default else 'false'}"
            elif is_sql_expr(default):
                col_def += f" NOT NULL DEFAULT {default}"
            elif isinstance(default, str):
                col_def += f" NOT NULL DEFAULT '{default}'"
            else:
                col_def += f" NOT NULL DEFAULT {default}"
        else:
            col_def += " NOT NULL"
    else:
        if default is not None:
            if isinstance(default, bool):
                col_def += f" DEFAULT {'true' if default else 'false'}"
            elif is_sql_expr(default):
                col_def += f" DEFAULT {default}"
            elif isinstance(default, str):
                col_def += f" DEFAULT '{default}'"
            else:
                col_def += f" DEFAULT {default}"

    return col_def


def generate_create_table(table_name, defn):
    properties = defn.get("properties", {})
    required = set(defn.get("required", []))

    # Find PK column(s)
    pk_cols = [c for c, p in properties.items() if is_pk(p)]

    col_defs = []
    fk_constraints = []

    for col_name, col_props in properties.items():
        is_primary = col_name in pk_cols and len(pk_cols) == 1
        col_def = pg_type(col_name, col_props, required, is_primary)
        col_defs.append(f"  {col_def}")

        fk = has_fk(col_props)
        if fk:
            ref_table, ref_col = fk
            fk_constraints.append(
                f"  CONSTRAINT fk_{table_name}_{col_name} "
                f"FOREIGN KEY ({col_name}) REFERENCES {ref_table}({ref_col})"
            )

    if len(pk_cols) > 1:
        col_defs.append(f"  PRIMARY KEY ({', '.join(pk_cols)})")

    all_defs = col_defs  # skip FK constraints for now (order matters)
    sql = f"CREATE TABLE IF NOT EXISTS public.{table_name} (\n"
    sql += ",\n".join(all_defs)
    sql += "\n);\n"
    sql += f"ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;\n"
    return sql


def run_sql_on_new(sql, label):
    out = curl_post_sql(NEW_PROJECT, NEW_TOKEN, sql)
    if '"message"' in out.lower():
        data = json.loads(out) if out.startswith(("{","[")) else {}
        msg = data.get("message", out[:200]) if isinstance(data, dict) else out[:200]
        if "already exists" in msg:
            print(f"  ⚠️  already exists (OK)")
        else:
            print(f"  ❌ {msg[:150]}")
        return False
    print(f"  ✅ OK")
    return True


def main():
    print("=== Fetching OpenAPI schema from old project ===")
    openapi = curl_get(f"{OLD_URL}/rest/v1/", {
        "Authorization": f"Bearer {OLD_SVC}",
        "apikey": OLD_SVC,
    })
    definitions = openapi.get("definitions", {})
    print(f"Found {len(definitions)} tables/views\n")

    # ── STEP 1: Create base tables ────────────────────────────────────────────
    print("=== Creating base tables on new project ===")
    for table_name in sorted(definitions.keys()):
        if table_name in CREATED_IN_MIGRATIONS:
            print(f"  skip {table_name} (created in migrations)")
            continue
        defn = definitions[table_name]
        print(f"  Creating {table_name}...", end=" ", flush=True)
        sql = generate_create_table(table_name, defn)
        run_sql_on_new(sql, table_name)
        time.sleep(0.2)

    print("\n=== Running all migration files ===")
    import os
    migration_files = sorted(f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql"))
    errors = []
    for fname in migration_files:
        with open(f"{MIGRATIONS_DIR}/{fname}", "r") as f:
            sql = f.read()
        print(f"  {fname}...", end=" ", flush=True)
        out = curl_post_sql(NEW_PROJECT, NEW_TOKEN, sql)
        if '"message"' in out.lower():
            data = json.loads(out) if out.startswith(("{","[")) else {}
            msg = data.get("message", out[:200]) if isinstance(data, dict) else out[:200]
            if any(x in msg for x in ("already exists", "duplicate")):
                print("✅ (already exists)")
            else:
                print(f"❌ {msg[:150]}")
                errors.append(fname)
        else:
            print("✅ OK")
        time.sleep(0.4)

    print(f"\n{'='*55}")
    if errors:
        print(f"❌ Still failing ({len(errors)}): {errors}")
    else:
        print("✅ Schema migration complete!")
    return len(errors)


if __name__ == "__main__":
    sys.exit(main())
