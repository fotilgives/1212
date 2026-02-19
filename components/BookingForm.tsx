
import React, { useState } from 'react';

const TELEGRAM_TOKEN = 'ВСТАВ_СВІЙ_ТОКЕН_ТУТ';
const CHAT_ID = 'ВСТАВ_СВІЙ_ID_ТУТ';

const BookingForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: 'Стрижка',
    date: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const sendBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // Форматування повідомлення згідно з інструкцією
    const message = `Новий запис! Ім'я: ${formData.name}, Послуга: ${formData.service}, Дата: ${formData.date}, Телефон: ${formData.phone}`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
        }),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', phone: '', service: 'Стрижка', date: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-10 animate-in fade-in zoom-in bg-white rounded-[32px] p-8">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h3 className="text-2xl font-playfair mb-2">Заявку надіслано!</h3>
        <p className="text-neutral-500 mb-6">Ми зв'яжемося з вами найближчим часом для підтвердження.</p>
        <button 
          onClick={() => setStatus('idle')} 
          className="text-sm font-bold uppercase tracking-wider border-b border-black pb-1 hover:text-neutral-600 hover:border-neutral-600 transition-colors"
        >
          Надіслати ще
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={sendBooking} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Ваше Ім'я</label>
        <input
          required
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          placeholder="Олена"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Телефон</label>
        <input
          required
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          placeholder="+380 XX XXX XX XX"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Послуга</label>
          <div className="relative">
            <select
              value={formData.service}
              onChange={(e) => setFormData({...formData, service: e.target.value})}
              className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all appearance-none cursor-pointer"
            >
              <option value="Стрижка">Стрижка</option>
              <option value="Фарбування">Фарбування</option>
              <option value="Догляд">Догляд</option>
              <option value="Укладка">Укладка</option>
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Дата</label>
          <input
            required
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all cursor-pointer"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-black text-white py-5 rounded-2xl font-semibold hover:bg-neutral-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {status === 'loading' ? 'Відправка...' : 'Записатись'}
      </button>

      {status === 'error' && (
        <p className="text-red-500 text-center text-xs mt-2 font-medium">Помилка відправки. Перевірте підключення або спробуйте пізніше.</p>
      )}
    </form>
  );
};

export default BookingForm;
