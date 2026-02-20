
import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';

// Використовуємо вашу реальну адресу серверу на Render
const API_URL = "/api";

interface TimeSlot {
  time: string;
  isBooked: boolean;
}

const BookingForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '+380',
    service: 'Складні техніки фарбування',
    date: '',
    time: '',
    telegramId: ''
  });

  const { telegramId } = useTelegram();

  useEffect(() => {
    if (telegramId) {
      setFormData(prev => ({ ...prev, telegramId: telegramId.toString() }));
    }
  }, [telegramId]);

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Get "Today" in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Fetch slots when date changes
  useEffect(() => {
    if (!formData.date) {
        setAvailableSlots([]);
        return;
    }

    setLoadingSlots(true);
    setFormData(prev => ({ ...prev, time: '' })); // Reset selected time

    console.log(`Fetching slots from: ${API_URL}/slots?date=${formData.date}`);

    fetch(`${API_URL}/slots?date=${formData.date}`)
      .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
      })
      .then((data: TimeSlot[]) => {
          setAvailableSlots(data);
          setLoadingSlots(false);
      })
      .catch(err => {
          console.error("Error loading slots:", err);
          // If fetch fails, we assume no slots or connection issue. 
          // We clear slots and stop loading to prevent UI hang.
          setAvailableSlots([]); 
          setLoadingSlots(false);
      });
  }, [formData.date]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('+380')) value = '+380';
    const numberPart = value.substring(1).replace(/[^0-9]/g, '');
    setFormData({ ...formData, phone: '+' + numberPart });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time) {
      alert("Будь ласка, оберіть дату та час візиту.");
      return;
    }
    
    setStatus('loading');

    try {
      const response = await fetch(`${API_URL}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('API Error:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-12 animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-neutral-900 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-3xl font-playfair mb-4 text-neutral-900 font-bold">Запит надіслано!</h3>
        <p className="text-neutral-500 text-lg font-light leading-relaxed mb-8">
          Ми перевіримо доступність на <b>{formData.date}</b> о <b>{formData.time}</b> та підтвердимо ваш запис.
        </p>
        <button 
          onClick={() => { 
            setStatus('idle'); 
            setFormData({ name: '', phone: '+380', service: 'Складні техніки фарбування', date: '', time: '' }); 
          }}
          className="text-[10px] font-bold uppercase tracking-[0.3em] border-b-2 border-black pb-1 hover:text-neutral-400 hover:border-neutral-200 transition-all"
        >
          Новий запис
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Name */}
      <div className="space-y-2">
        <label className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 ml-4">Ваше Ім'я</label>
        <input
          required
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-neutral-50/50 border-b border-neutral-100 px-6 py-5 outline-none focus:border-black transition-all text-lg font-light text-neutral-800 rounded-t-2xl focus:bg-white"
          placeholder="Олена"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 ml-4">Телефон</label>
        <input
          required
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
          maxLength={13}
          className="w-full bg-neutral-50/50 border-b border-neutral-100 px-6 py-5 outline-none focus:border-black transition-all text-lg font-light text-neutral-800 focus:bg-white"
        />
      </div>

      {/* Service */}
      <div className="space-y-2">
        <label className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 ml-4">Послуга</label>
        <div className="relative">
          <select
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            className="w-full bg-neutral-50/50 border-b border-neutral-100 px-6 py-5 outline-none focus:border-black transition-all text-lg font-light text-neutral-800 appearance-none cursor-pointer focus:bg-white"
          >
            <option value="Складні техніки фарбування">Складні техніки фарбування (від 3000₴)</option>
            <option value="Фарбування тон в тон">Фарбування тон в тон (від 2000₴)</option>
            <option value="Тонування">Тонування (від 1200₴)</option>
            <option value="Вихід з чорного">Вихід з чорного (від 3500₴)</option>
            <option value="Відновлення волосся">Відновлення волосся (від 1500₴)</option>
          </select>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="space-y-6 pt-4">
        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 ml-4">Бажана Дата</label>
          <input
            required
            type="date"
            min={today}
            value={formData.date}
            onChange={(e) => {
              setFormData({ ...formData, date: e.target.value });
            }}
            className="w-full bg-neutral-50/50 border-b border-neutral-100 px-6 py-5 outline-none focus:border-black transition-all text-lg font-light text-neutral-800 cursor-pointer focus:bg-white"
          />
        </div>

        {/* Time Slots */}
        <div className={`space-y-3 transition-all duration-500 ${formData.date ? 'opacity-100 max-h-96' : 'opacity-50 max-h-0 overflow-hidden grayscale'}`}>
          <label className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 ml-4">
             {formData.date ? `Час для ${formData.date}` : 'Оберіть дату'}
          </label>
          
          {loadingSlots ? (
              <div className="flex items-center justify-center py-4 space-x-2 text-neutral-400">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-200"></div>
              </div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 px-2">
                {availableSlots.map((slot) => {
                return (
                    <button
                    key={slot.time}
                    type="button"
                    disabled={slot.isBooked}
                    onClick={() => setFormData({ ...formData, time: slot.time })}
                    className={`py-3 px-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
                        slot.isBooked 
                            ? 'bg-neutral-100 text-neutral-300 border-transparent cursor-not-allowed line-through decoration-neutral-400' 
                            : formData.time === slot.time
                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg scale-105'
                                : 'bg-white text-neutral-600 border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                    >
                    {slot.time}
                    </button>
                );
                })}
            </div>
          ) : (
             <div className="text-sm text-neutral-400 px-4 italic">
                {formData.date && "На цю дату ще немає вільних слотів."}
             </div>
          )}
          
          {formData.date && !formData.time && availableSlots.length > 0 && !loadingSlots && (
            <p className="text-xs text-neutral-400 ml-4 animate-pulse">Оберіть зручний час</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading' || !formData.date || !formData.time}
        className="w-full bg-black text-white py-7 rounded-full font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transform active:scale-[0.98] mt-8"
      >
        {status === 'loading' ? 'Обробка...' : 'Підтвердити запис'}
      </button>

      {status === 'error' && (
        <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-center text-xs uppercase tracking-widest mt-4">
          Помилка з'єднання з сервером. Перевірте підключення.
        </div>
      )}
    </form>
  );
};

export default BookingForm;
