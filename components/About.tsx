
import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 md:py-32 px-6 md:px-8 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 items-center">
          <div className="md:col-span-6 lg:col-span-5 order-2 md:order-1 space-y-10">
             <div className="space-y-4">
               <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 block font-bold">Філософія бренду</span>
               <h2 className="font-playfair text-4xl md:text-6xl mb-8 leading-[1.1] text-neutral-900">Більше ніж <br/><span className="italic">просто зачіска</span></h2>
             </div>
             
             <p className="text-base md:text-lg text-neutral-500 leading-relaxed font-light">
               Для мене кожен клієнт — це унікальне полотно. Я не просто змінюю колір чи довжину, я допомагаю вам побачити себе по-новому. Моя робота базується на трьох принципах: здоров'я волосся, індивідуальність та актуальність.
             </p>

             <div className="grid grid-cols-2 gap-12 pt-10 border-t border-neutral-200">
               <div className="space-y-2">
                 <div className="text-4xl md:text-5xl font-playfair italic text-neutral-800">10+</div>
                 <div className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">Років у професії</div>
               </div>
               <div className="space-y-2">
                 <div className="text-4xl md:text-5xl font-playfair italic text-neutral-800">5000+</div>
                 <div className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">Задоволених клієнтів</div>
               </div>
             </div>
          </div>

          <div className="md:col-span-6 lg:col-span-7 order-1 md:order-2 grid grid-cols-2 gap-4 md:gap-8">
             <div className="aspect-[3/4] rounded-[40px] overflow-hidden shadow-2xl hover:-translate-y-3 transition-all duration-700 relative group">
               <img 
                 src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1200&auto=format&fit=crop" 
                 alt="Студія" 
                 className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
               />
               <div className="absolute inset-0 bg-black/10"></div>
             </div>
             <div className="aspect-[3/4] rounded-[40px] overflow-hidden shadow-2xl mt-12 md:mt-20 hover:-translate-y-3 transition-all duration-700 relative group">
               <img 
                 src="https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1200&auto=format&fit=crop" 
                 alt="Процес" 
                 className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
               />
               <div className="absolute inset-0 bg-black/10"></div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
