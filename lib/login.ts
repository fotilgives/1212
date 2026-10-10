import { supabase } from './supabase';

type LoginError = { message?: string; code?: string } | null;

export function loginErrorMessage(error: LoginError): string {
  if (!error || /bad credentials|invalid login credentials/i.test(error.message || '')) {
    return 'Невірний логін або пароль';
  }
  return 'Сервіс входу тимчасово недоступний. Спробуйте пізніше. Ваш пароль не потрібно змінювати.';
}

export async function requestLogin(fn: 'rps_login' | 'rps_admin_login', login: string, password: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await supabase.rpc(fn, { p_login: login.trim(), p_password: password })
      .abortSignal(controller.signal);
  } catch {
    return { data: null, error: { message: 'Login service unavailable' } };
  } finally {
    clearTimeout(timeout);
  }
}
