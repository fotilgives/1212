import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Review { id: number; nickname: string; rating: number; text: string; }

const ReviewsWall: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('rps_reviews')
        .select('id,nickname,rating,text')
        .eq('hidden', false)
        .order('created_at', { ascending: false })
        .limit(12);
      if (data) setReviews(data as Review[]);
    })();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-5">
      <div className="text-center">
        <span className="eyebrow">⭐ Відгуки</span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Що кажуть учасники</h2>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.05 }}
            className="relative rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <Quote className="absolute right-4 top-4 h-6 w-6 text-emerald-100" />
            <div className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: r.rating || 0 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-amber-400" />)}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.text}</p>
            <div className="mt-3 text-xs font-bold text-slate-900">— {r.nickname}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ReviewsWall;
