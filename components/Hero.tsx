
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 pb-12 px-6 md:px-8 overflow-hidden bg-[#fafafa]">
      {/* Editorial Grain Texture - Masks artifacts */}
      <div className="absolute inset-0 z-40 pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[5%] right-[10%] w-[40vw] h-[40vw] bg-pink-100/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[5%] left-[5%] w-[35vw] h-[35vw] bg-neutral-200/40 rounded-full blur-[100px] animate-pulse [animation-delay:2s]"></div>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-4 items-center z-10">
        
        {/* Typography Column */}
        <div className="lg:col-span-6 order-2 lg:order-1 space-y-12 text-center lg:text-left">
          <div className="space-y-8">
            <div className="flex items-center justify-center lg:justify-start space-x-4">
              <span className="w-12 h-[1px] bg-black/20"></span>
              <span className="text-[10px] font-extrabold tracking-[0.5em] uppercase text-neutral-400">
                Premium Hair Artist
              </span>
            </div>
            
            <h1 className="font-playfair text-6xl md:text-8xl lg:text-[110px] leading-[0.85] font-medium tracking-tighter text-neutral-900">
              Світлана <br />
              <span className="italic text-neutral-300 relative ml-0 lg:ml-20 block lg:inline">
                Мазур
                <svg className="absolute -bottom-4 left-0 w-full h-3 text-pink-200/40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-base md:text-xl text-neutral-500 max-w-md mx-auto lg:mx-0 font-light leading-relaxed">
              Ваше волосся — це полотно. Я створюю шедеври, що підкреслюють вашу природну велич та стиль.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
            <a href="#contact" className="group relative bg-black text-white px-14 py-6 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] overflow-hidden transition-all shadow-2xl hover:scale-105 active:scale-95 text-center">
              <span className="relative z-10">Записатися</span>
              <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </a>
            <a href="#gallery" className="inline-flex items-center justify-center space-x-4 group py-6">
               <span className="text-[11px] font-bold uppercase tracking-[0.25em] border-b border-black pb-1 group-hover:text-neutral-400 group-hover:border-neutral-200 transition-all">Портфоліо</span>
            </a>
          </div>
        </div>

        {/* Artistic Frame Container */}
        <div className="lg:col-span-6 order-1 lg:order-2 flex justify-center lg:justify-end relative">
          <div className="relative w-full max-w-[380px] lg:max-w-[440px]">
            
            {/* The "Editorial" Frame - masks low res by scaling down image size in layout */}
            <div className="relative aspect-[3/4] rounded-t-full rounded-b-[40px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] bg-white ring-8 ring-white/50">
              <img 
                src="" 
                alt="Світлана Мазур" 
                className="w-full h-full object-cover object-center scale-[1.05] group-hover:scale-110 transition-transform duration-[5s] ease-out contrast-[1.02] brightness-[1.01]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-40"></div>
            </div>

            {/* Aesthetic Badges */}
            <div className="absolute -bottom-8 -left-8 bg-white p-8 rounded-[40px] shadow-2xl border border-neutral-100 max-w-[200px] hidden md:block">
              <p className="font-playfair italic text-2xl text-neutral-800 leading-tight mb-2">Мистецтво</p>
              <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">в кожній лінії вашого образу</p>
            </div>

            <div className="absolute top-12 -right-8 w-32 h-32 bg-pink-50/90 backdrop-blur-md rounded-full flex items-center justify-center border border-white shadow-xl animate-spin-slow">
              <svg viewBox="0 0 100 100" className="w-full h-full p-4">
                <path id="curve" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                <text className="text-[10px] uppercase font-bold tracking-[0.2em]">
                  <textPath xlinkHref="#curve">EXPERT HAIR DESIGN • SVETLANA MAZUR •</textPath>
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}} />
    </section>
  );
};

export default Hero;
