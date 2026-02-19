
import React from 'react';

const services = [
  {
    title: 'Складні техніки фарбування',
    price: 'від 3000 ₴',
    desc: 'Airtouch, балаяж, шатуш, рельєфне фарбування, мікромілірування.',
    image: 'https://ruki-nozhnitsi.com.ua/wp-content/uploads/2024/05/airtouch-ombre-balayage.jpg',
  },
  {
    title: 'Фарбування тон в тон',
    price: 'від 2000 ₴',
    desc: 'Ідеальне вирівнювання кольору та надання блиску.',
    image: 'https://iq13.com.ua/storage/media/ae8e4227-e112-48fd-b2d3-cf49907488f3.jpeg',
  },
  {
    title: 'Тонування',
    price: 'від 1200 ₴',
    desc: 'Корекція відтінку та оновлення кольору без пошкодження.',
    image: 'https://fastlinestudio.pl/wp-content/webp-express/webp-images/uploads/2023/12/img_809-0.jpg.webp',
  },
  {
    title: 'Вихід з чорного',
    price: 'від 3500 ₴',
    desc: 'Професійне та безпечне освітлення темних відтінків.',
    image: 'https://i.pinimg.com/736x/cd/88/d4/cd88d406c350fd817ebcb9501085caad.jpg',
  },
  {
    title: 'Відновлення волосся',
    price: 'від 1500 ₴',
    desc: 'Процедури Lanza, Screen, Sensus для глибокої реконструкції.',
    image: 'https://ruki-nozhnitsi.com.ua/wp-content/uploads/2024/10/img_0348.jpg',
  },
];

const Services: React.FC = () => {
  return (
    <section id="services" className="py-24 md:py-32 px-6 md:px-8 bg-white">
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

        {/* Uniform Grid - Vertical Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <div 
              key={idx} 
              className="group flex flex-col bg-white rounded-[32px] overflow-hidden border border-neutral-100 hover:shadow-2xl transition-all duration-500"
            >
              {/* Image Container - Vertical Aspect Ratio 3:4 */}
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-100">
                 <img 
                   src={service.image} 
                   alt={service.title}
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                   style={{ 
                     imageRendering: 'high-quality' as any,
                     objectFit: 'cover'
                   }}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              
              {/* Content */}
              <div className="p-8 flex flex-col flex-grow justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-playfair text-2xl font-medium text-neutral-900 leading-tight">
                        {service.title}
                    </h3>
                  </div>
                  <p className="text-neutral-500 text-sm font-light leading-relaxed">
                    {service.desc}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-neutral-50 flex items-center justify-between">
                     <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-900 bg-neutral-50 px-4 py-2 rounded-full">
                        {service.price}
                     </span>
                     <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center group-hover:bg-black group-hover:border-black group-hover:text-white transition-all">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                     </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
