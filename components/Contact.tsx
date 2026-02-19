
import React from 'react';
import BookingForm from './BookingForm';

const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-24 md:py-32 px-6 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">
        <div className="space-y-12">
          <div className="space-y-6">
            <span className="text-[10px] uppercase tracking-[0.5em] text-neutral-400 font-bold block">Бронювання</span>
            <h2 className="font-playfair text-6xl md:text-7xl leading-[1] text-neutral-900">Готові до <br /><span className="italic text-neutral-300">перевтілення?</span></h2>
            <p className="text-neutral-500 max-w-sm text-lg font-light leading-relaxed">
              Залиште ваші контакти, і ми зв'яжемося для підтвердження візиту.
            </p>
          </div>

          <div className="space-y-10">
            <div className="flex items-center space-x-8 group">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-900 border border-neutral-100 group-hover:bg-black group-hover:text-white transition-all duration-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Зателефонуйте нам</div>
                <div className="text-2xl font-playfair font-medium text-neutral-800">+380 97 911 20 15</div>
              </div>
            </div>

            <div className="flex items-center space-x-8 group">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-900 border border-neutral-100 group-hover:bg-black group-hover:text-white transition-all duration-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Локація</div>
                <div className="text-2xl font-playfair font-medium text-neutral-800">м. Вінниця, вул. Соборна</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 md:p-16 rounded-[60px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] border border-neutral-50">
          <BookingForm />
        </div>
      </div>
    </section>
  );
};

export default Contact;
