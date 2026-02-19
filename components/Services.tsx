
import React from 'react';

const services = [
  {
    title: 'Ексклюзивні Стрижки',
    price: 'від 900 ₴',
    desc: 'Архітектура форми, що враховує ваш тип обличчя та спосіб життя.',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=1000&auto=format&fit=crop',
    featured: true
  },
  {
    title: 'Art-Фарбування',
    price: 'від 1800 ₴',
    desc: 'Airtouch, Balayage, Handtouch. Природність та глибина кольору.',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=1000&auto=format&fit=crop',
    featured: false
  },
  {
    title: 'Molecular Догляд',
    price: 'від 1200 ₴',
    desc: 'Відновлення структури на клітинному рівні преміум-засобами.',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=1000&auto=format&fit=crop',
    featured: false
  },
  {
    title: 'Вечірній Образ',
    price: 'від 800 ₴',
    desc: 'Укладки та зачіски для особливих моментів вашого життя.',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=1000&auto=format&fit=crop',
    featured: true
  }
];

const Services: React.FC = () => {
  return (
    <section id="services" className="py-24 md:py-32 px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 mb-4 block font-bold">Прейскурант</span>
            <h2 className="font-playfair text-5xl md:text-7xl leading-tight text-neutral-900">Послуги <br/> & Вартість</h2>
          </div>
          <p className="text-neutral-400 text-sm max-w-[280px] leading-relaxed hidden md:block">
            Ми використовуємо лише сертифіковані бренди преміум-сегменту для досягнення найкращого результату.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {services.map((service, idx) => (
            <div 
              key={idx} 
              className={`bento-card group flex flex-col justify-between p-8 min-h-[480px] ${service.featured ? 'lg:col-span-2' : 'lg:col-span-1'}`}
            >
              <div className="relative w-full aspect-[16/9] mb-8 rounded-[24px] overflow-hidden">
                 <img 
                   src={service.image} 
                   alt={service.title}
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1s]"
                 />
                 <div className="absolute inset-0 bg-black/5"></div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-playfair text-3xl font-medium text-neutral-800">{service.title}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-neutral-100 px-4 py-2 rounded-full">{service.price}</span>
                </div>
                <p className="text-neutral-500 text-sm font-light leading-relaxed max-w-sm">
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
