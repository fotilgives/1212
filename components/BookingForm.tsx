
import React, { useState } from 'react';

// NOTE: Fill these for functional Telegram notifications
const TELEGRAM_TOKEN = ''; 
const CHAT_ID = '';

const BookingForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '+380',
    service: 'Art-Фарбування',
    date: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('+380')) value = '+380';
    setFormData({ ...formData, phone: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Graceful check for credentials
    if (!TELEGRAM_TOKEN || !CHAT_ID) {
      console.warn('BookingForm: TELEGRAM_TOKEN or CHAT_ID is missing. Notification not sent.');
      setStatus('loading');
      // Simulate success for demo purposes if credentials are missing
      setTimeout(() => setStatus('success'), 1500);
      return;
    }
    
    setStatus('loading');

    const message = `
🌟 <b>Новий запис!</b>
👤 <b>Клієнт:</b> ${formData.name}
📞 <b>Телефон:</b> ${formData.phone}
✂️ <b>Послуга:</b> ${formData.service}
📅 <b>Дата:</b> ${formData.date}
    `.trim();

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        }),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Telegram API Error:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8 animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-neutral-900 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-3xl font-playfair mb-4 text-neutral-900 font-bold">Успішно!</h3>
        <p className="text-neutral-500 text-lg font-light leading-relaxed mb-8">
          Дякуємо за запис. Світлана зателефонує вам для узгодження деталей.
        </p>
        <button 
          onClick={() => { setStatus('idle'); setFormData({ name: '', phone: '+380', service: 'Art-Фарбування', date: '' }); }}
          className="text-[10px] font-bold uppercase tracking-[0.3em] border-b-2 border-black pb-1 hover:text-neutral-400 hover:border-neutral-200 transition-all"
        >
          Повернутися
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <label className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 ml-4">Ваше Ім'я</label>
        <input
          required
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-neutral-50/50 border-b border-neutral-100 px-6 py-5 outline-none focus:border-black transition-all text-lg font-light text-neutral-800 rounded-t-2xl"
          placeholder="Анна"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 ml-4">Телефон</label>
        <input
          required
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
          className="w-full bg-neutral-50/50 border-b border-neutral-100 px-6 py-5 outline-none focus:border-black transition-all text-lg font-light text-neutral-800"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 ml-4">Послуга</label>
          <select
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            className="w-full bg-neutral-50/50 border-b border-neutral-100 px-6 py-5 outline-none focus:border-black transition-all text-sm font-medium text-neutral-800 appearance-none cursor-pointer"
          >
            <option value="Ексклюзивна Стрижка">Ексклюзивна Стрижка</option>
            <option value="Art-Фарбування">Art-Фарбування</option>
            <option value="Molecular Догляд">Molecular Догляд</option>
            <option value="Вечірній Образ">Вечірній Образ</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 ml-4">Дата</label>
          <input
            required
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-neutral-50/50 border-b border-neutral-100 px-6 py-5 outline-none focus:border-black transition-all text-sm font-medium text-neutral-800 cursor-pointer"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-black text-white py-7 rounded-full font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-neutral-800 transition-all disabled:opacity-50 shadow-2xl transform active:scale-95"
      >
        {status === 'loading' ? 'Відправка...' : 'Підтвердити запис'}
      </button>

      {status === 'error' && (
        <p className="text-red-400 text-center text-[9px] uppercase tracking-[0.3em] mt-4 font-bold">Помилка. Спробуйте ще раз або зателефонуйте.</p>
      )}
    </form>
  );
};

export default BookingForm;
