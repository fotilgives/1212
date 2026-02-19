
import React from 'react';

const services = [
  {
    title: 'Стрижки',
    price: 'від 800 грн',
    desc: 'Персоналізовані форми, що підкреслюють риси обличчя та структуру волосся.',
    size: 'lg',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=1287&auto=format&fit=crop'
  },
  {
    title: 'Фарбування',
    price: 'від 1500 грн',
    desc: 'Складні техніки: Airtouch, Balayage, Shatush для ідеального переливу.',
    size: 'sm',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=1469&auto=format&fit=crop'
  },
  {
    title: 'Догляд',
    price: 'від 1200 грн',
    desc: 'Преміальні процедури відновлення для здоров’я та блиску.',
    size: 'sm',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=1470&auto=format&fit=crop'
  },
  {
    title: 'Укладки',
    price: 'від 600 грн',
    desc: 'Від легких хвиль до вечірніх зачісок для ваших подій.',
    size: 'lg',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=1287&auto=format&fit=crop'
  }
];

const Services: React.FC = () => {
  return (
    <section id="services" className="py-16 md:py-24 px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-16 gap-6">
          <div className="max-w-xl">
            <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-neutral-400 mb-4 block font-bold">Наші Послуги</span>
            <h2 className="font-playfair text-4xl md:text-6xl leading-tight">Мистецтво <br className="hidden md:block"/> перевтілення</h2>
          </div>
          <div className="bg-neutral-100 p-1.5 rounded-full hidden md:flex">
             <button className="px-6 py-2 bg-white rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-all">Жінки</button>
             <button className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black transition-colors">Чоловіки</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {services.map((service, idx) => (
            <div 
              key={idx} 
              className={`bento-card group p-6 md:p-8 flex flex-col justify-between min-h-[380px] md:min-h-[450px] ${service.size === 'lg' ? 'md:col-span-2' : 'md:col-span-1'}`}
            >
              <div className="relative w-full aspect-[16/9] mb-6 rounded-2xl overflow-hidden bg-neutral-100">
                 <img 
                   src={service.image} 
                   alt={service.title}
                   className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                 />
                 <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="font-playfair text-2xl md:text-3xl font-medium">{service.title}</h3>
                  <span className="text-black bg-neutral-100 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">{service.price}</span>
                </div>
                <p className="text-neutral-500 text-sm leading-relaxed max-w-sm">
                  {service.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
