import React, { useState } from 'react';

const VisitPrep: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const tips = [
    {
      question: "Чи потрібно мити голову перед візитом?",
      answer: "Для складних технік фарбування (AirTouch, Balayage) краще приходити з немитою головою (1-2 дні). Це захищає шкіру голови. Для стрижки або догляду - можна з чистою."
    },
    {
      question: "Скільки часу займає процедура?",
      answer: "Складне фарбування займає від 4 до 6 годин. Тонування - 1.5-2 години. Стрижка - 1 година. Плануйте свій час так, щоб не поспішати."
    },
    {
      question: "Що одягнути?",
      answer: "Одягніть щось зручне, без високого коміра або капюшона, щоб вони не заважали майстру працювати з потилицею."
    },
    {
      question: "Чи можна з дітьми?",
      answer: "Ми любимо дітей, але процедури тривають довго, і хімічні випари можуть бути шкідливими. Для вашого комфорту та безпеки краще приходити самим."
    }
  ];

  return (
    <section className="py-24 px-6 md:px-8 bg-white">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        <div className="sticky top-32">
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold block mb-6">Важливо знати</span>
          <h2 className="font-playfair text-5xl md:text-6xl text-neutral-900 leading-[1.1] mb-8">
            Підготовка <br /><span className="italic text-neutral-400">до візиту</span>
          </h2>
          <p className="text-neutral-500 text-lg font-light leading-relaxed mb-8">
            Щоб результат перевершив ваші очікування, ми підготували кілька простих порад. Дотримання цих рекомендацій допоможе нам створити ідеальний образ для вас.
          </p>
          <div className="w-24 h-[1px] bg-neutral-200"></div>
        </div>

        <div className="space-y-4">
          {tips.map((tip, index) => (
            <div 
              key={index} 
              className="border-b border-neutral-100 last:border-0 pb-4"
            >
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left py-6 flex items-center justify-between group"
              >
                <span className={`font-playfair text-xl md:text-2xl transition-colors duration-300 ${openIndex === index ? 'text-neutral-900' : 'text-neutral-400 group-hover:text-neutral-600'}`}>
                  {tip.question}
                </span>
                <span className={`transform transition-transform duration-300 text-neutral-300 ${openIndex === index ? 'rotate-45 text-neutral-900' : ''}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </span>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-48 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-neutral-500 font-light leading-relaxed pl-4 border-l-2 border-neutral-100">
                  {tip.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VisitPrep;
