
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 pb-12 px-6 md:px-8 overflow-hidden bg-white">
      {/* Texture Layer */}
      <div className="absolute inset-0 z-40 pointer-events-none opacity-[0.04] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10">
        
        {/* Content Side */}
        <div className="lg:col-span-6 order-2 lg:order-1 space-y-12 text-center lg:text-left">
          <div className="space-y-10">
            <div className="inline-flex items-center space-x-4">
              <span className="w-10 h-[1px] bg-neutral-300"></span>
              <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-neutral-400">
                PREMIUM HAIR STYLIST
              </span>
            </div>
            
            <h1 className="font-playfair text-7xl md:text-8xl lg:text-[120px] leading-[0.8] font-medium tracking-tighter text-neutral-900">
              Світлана <br />
              <span className="italic text-neutral-300 relative ml-0 lg:ml-12 block lg:inline">
                Мазур
              </span>
            </h1>
            
            <p className="text-base md:text-xl text-neutral-400 max-w-md mx-auto lg:mx-0 font-light leading-relaxed">
              Справжня розкіш — це гармонія. Створюю образи, які розкривають вашу справжню сутність.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-6">
            <a href="#contact" className="group relative bg-black text-white px-16 py-7 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] overflow-hidden transition-all shadow-2xl hover:scale-105 active:scale-95 text-center">
              <span className="relative z-10">Записатися зараз</span>
              <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </a>
            <a href="#gallery" className="inline-flex items-center justify-center space-x-4 group py-7">
               <span className="text-[11px] font-bold uppercase tracking-[0.25em] border-b border-black/20 pb-1 group-hover:text-black group-hover:border-black transition-all">Мої роботи</span>
            </a>
          </div>
        </div>

        {/* Image Side */}
        <div className="lg:col-span-6 order-1 lg:order-2 flex justify-center lg:justify-end relative">
          <div className="relative w-full max-w-[420px] lg:max-w-[480px]">
            
            {/* Main Editorial Frame */}
            <div className="relative aspect-[3/4] rounded-t-full rounded-b-[40px] overflow-hidden shadow-[0_60px_100px_-30px_rgba(0,0,0,0.2)] bg-neutral-100 ring-[12px] ring-white">
              <img 
                src="https://image2url.com/r2/default/images/1771516163140-df3aaee6-ddcb-445b-9359-b65b23cca1a1.jpg" 
                alt="Світлана Мазур - Hair Stylist" 
                width={800}
                height={1067}
                className="w-full h-full object-cover object-top scale-[1.02] hover:scale-110 transition-transform duration-[4s] ease-out contrast-[1.05]"
                style={{
                    imageRendering: 'high-quality' as any
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60"></div>
            </div>

            {/* Float Label */}
            <div className="absolute -bottom-6 -left-10 bg-white/90 backdrop-blur-md p-10 rounded-[40px] shadow-2xl border border-neutral-100 max-w-[220px] hidden md:block">
              <p className="font-playfair italic text-3xl text-neutral-800 leading-tight mb-3">Естетика</p>
              <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold leading-relaxed">деталі, що створюють досконалий стиль</p>
            </div>

            {/* Rotating Badge */}
            <div className="absolute top-16 -right-10 w-36 h-36 bg-white/60 backdrop-blur-lg rounded-full flex items-center justify-center border border-white shadow-xl animate-spin-slow pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full p-4">
                <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                <text className="text-[11px] uppercase font-bold tracking-[0.2em] fill-neutral-800">
                  <textPath xlinkHref="#circlePath">SVETLANA MAZUR • HAIR STYLIST •</textPath>
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
          animation: spin-slow 25s linear infinite;
        }
      `}} />
    </section>
  );
};

export default Hero;
