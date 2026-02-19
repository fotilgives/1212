
import React from 'react';
import BookingForm from './BookingForm';

const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-24 px-6 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-start">
        <div className="space-y-12 pt-8">
          <div>
            <h2 className="font-playfair text-5xl md:text-6xl mb-6 leading-tight">Запишіться на <br /><span className="italic">візит</span></h2>
            <p className="text-neutral-500 max-w-sm text-lg font-light leading-relaxed">
              Оберіть зручний час та послугу. Ми створимо для вас ідеальний образ.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center space-x-5 group cursor-pointer">
              <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Телефон</div>
                <div className="text-xl font-medium font-playfair">+380 97 911 20 15</div>
              </div>
            </div>

            <div className="flex items-center space-x-5 group cursor-pointer">
              <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Адреса</div>
                <div className="text-xl font-medium font-playfair">м. Вінниця, Центр</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-50 p-8 md:p-12 rounded-[48px] border border-neutral-100 shadow-sm">
          <BookingForm />
        </div>
      </div>
    </section>
  );
};

export default Contact;
