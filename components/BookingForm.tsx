
import React, { useState } from 'react';

// НАЛАШТУВАННЯ ТЕЛЕГРАМ БОТА
const TELEGRAM_TOKEN = 'ВАШ_ТОКЕН_ТУТ';
const CHAT_ID = 'ВАШ_ID_ТУТ';

const BookingForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '+380',
    service: 'Фарбування',
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
    setStatus('loading');

    const message = `
🌟 <b>Новий запис на візит</b>
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
      console.error('Telegram Error:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-12 px-6 animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-3xl font-playfair mb-4">Дякуємо!</h3>
        <p className="text-neutral-500 text-lg font-light leading-relaxed mb-8">
          Світлана Мазур зв’яжеться з вами найближчим часом для підтвердження візиту.
        </p>
        <button 
          onClick={() => { setStatus('idle'); setFormData({ name: '', phone: '+380', service: 'Фарбування', date: '' }); }}
          className="text-[10px] font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:text-neutral-400 hover:border-neutral-200 transition-all"
        >
          Зробити ще один запис
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 ml-4">Ваше Ім'я</label>
        <input
          required
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-white border-b-2 border-neutral-100 px-6 py-4 outline-none focus:border-black transition-all text-lg font-light"
          placeholder="Олена"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 ml-4">Номер Телефону</label>
        <input
          required
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
          className="w-full bg-white border-b-2 border-neutral-100 px-6 py-4 outline-none focus:border-black transition-all text-lg font-light"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 ml-4">Послуга</label>
          <select
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            className="w-full bg-white border-b-2 border-neutral-100 px-6 py-4 outline-none focus:border-black transition-all text-lg font-light appearance-none cursor-pointer"
          >
            <option value="Фарбування">Фарбування</option>
            <option value="Стрижка">Стрижка</option>
            <option value="Догляд">Догляд</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 ml-4">Бажана Дата</label>
          <input
            required
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-white border-b-2 border-neutral-100 px-6 py-4 outline-none focus:border-black transition-all text-lg font-light cursor-pointer"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-black text-white py-6 rounded-full font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-neutral-800 transition-all disabled:opacity-50 shadow-xl hover:shadow-2xl transform active:scale-95 mt-4"
      >
        {status === 'loading' ? 'Відправка...' : 'Записатися'}
      </button>

      {status === 'error' && (
        <p className="text-red-400 text-center text-[10px] uppercase tracking-widest mt-4">Виникла помилка. Спробуйте пізніше.</p>
      )}
    </form>
  );
};

export default BookingForm;
