
import React from 'react';

// About component implementation
const About: React.FC = () => {
  return (
    <section id="about" className="py-16 md:py-24 px-6 md:px-8 bg-neutral-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="md:col-span-6 lg:col-span-5 order-2 md:order-1">
             <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-neutral-400 mb-4 block font-bold">Про майстра</span>
             <h2 className="font-playfair text-3xl md:text-5xl mb-6 md:mb-8 leading-tight">Філософія <br/> природної краси</h2>
             <p className="text-base md:text-lg text-neutral-600 leading-relaxed mb-8 font-light text-justify md:text-left">
               Я вірю, що кожна жінка має унікальну історію, яку можна розповісти через її образ. Моя місія — знайти цей ідеальний баланс між сучасними трендами та вашим внутрішнім світом. Ми створюємо не просто зачіску, а настрій.
             </p>
             <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-200">
               <div>
                 <div className="text-3xl md:text-4xl font-playfair mb-2 italic">10+</div>
                 <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Років досвіду</div>
               </div>
               <div>
                 <div className="text-3xl md:text-4xl font-playfair mb-2 italic">5k+</div>
                 <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Щасливих клієнтів</div>
               </div>
             </div>
          </div>
          <div className="md:col-span-6 lg:col-span-7 order-1 md:order-2 grid grid-cols-2 gap-4 md:gap-6">
             <div className="aspect-[3/4] bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-lg hover:-translate-y-2 transition-transform duration-500 relative group">
               <img 
                 src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1470&auto=format&fit=crop" 
                 alt="Salon Atmosphere" 
                 className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
               />
               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
               <span className="absolute bottom-6 left-6 text-[10px] uppercase tracking-widest text-white font-bold rotate-90 origin-left">STUDIO ATMOSPHERE</span>
             </div>
             <div className="aspect-[3/4] bg-neutral-200 rounded-[24px] md:rounded-[32px] mt-8 md:mt-12 overflow-hidden shadow-lg hover:-translate-y-2 transition-transform duration-500 relative group">
               <img 
                 src="https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1469&auto=format&fit=crop" 
                 alt="Hair Art" 
                 className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
               />
               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
               <span className="absolute bottom-6 left-6 text-[10px] uppercase tracking-widest text-white font-bold -rotate-90 origin-left">ART OF HAIR</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
