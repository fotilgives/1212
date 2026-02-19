
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 pb-12 px-6 md:px-8 overflow-hidden bg-[#fafafa]">
      {/* Editorial Noise Overlay to hide pixelation */}
      <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-pink-100/40 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-neutral-200/50 rounded-full blur-[100px] animate-pulse [animation-delay:3s]"></div>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-4 items-center z-10">
        
        {/* Left Column: Typography */}
        <div className="lg:col-span-5 order-2 lg:order-1 space-y-10 text-center lg:text-left">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-3">
              <span className="w-10 h-[1px] bg-black"></span>
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-neutral-400">
                Premium Artistry
              </span>
            </div>
            
            <h1 className="font-playfair text-6xl md:text-8xl lg:text-[110px] leading-[0.9] font-medium tracking-tighter text-neutral-900">
              Svetlana <br />
              <span className="italic text-neutral-300 relative">
                Mazur
                <svg className="absolute -bottom-2 left-0 w-full h-2 text-pink-100/60 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4"/></svg>
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-neutral-500 max-w-sm mx-auto lg:mx-0 font-light leading-relaxed">
              Трансформація через естетику. Створюю бездоганні образи для тих, хто цінує деталі та високий стиль.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
            <a href="#contact" className="group relative bg-black text-white px-12 py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] overflow-hidden transition-all shadow-2xl hover:scale-105 active:scale-95">
              <span className="relative z-10">Забронювати візит</span>
              <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </a>
            <a href="#gallery" className="inline-flex items-center space-x-4 group">
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] border-b border-black pb-1 group-hover:text-neutral-500 group-hover:border-neutral-300 transition-all">Переглянути роботи</span>
            </a>
          </div>
        </div>

        {/* Right Column: Stylized Image Container */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex justify-center lg:justify-end relative pr-0 lg:pr-12">
          <div className="relative w-full max-w-[420px] lg:max-w-[480px]">
            
            {/* Background Decorative Frame */}
            <div className="absolute -inset-4 md:-inset-8 border border-neutral-200 rounded-[60px] -z-10 rotate-3"></div>
            
            {/* Main Image Wrapper - smaller scale for sharpness */}
            <div className="relative aspect-[4/5] rounded-[48px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] bg-white group">
              {/* Fix: use 'auto' instead of 'high-quality' to satisfy TypeScript ImageRendering type */}
              <img 
                src="https://ibb.co/fVVcPwzR.jpg" 
                alt="Світлана Мазур" 
                className="w-full h-full object-cover object-center scale-[1.02] group-hover:scale-110 transition-transform duration-[4s] ease-out contrast-[1.05] brightness-[1.02]"
                style={{ imageRendering: 'auto' }}
              />
              
              {/* Subtle Gradient Veil */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60"></div>
              
              {/* Floating Overlay Info */}
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[8px] uppercase tracking-widest font-bold opacity-70 mb-1">Based in</div>
                    <div className="text-sm font-medium">Vinnytsia, UA</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Floating Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-50/80 backdrop-blur-xl rounded-full -z-10 animate-spin-slow">
              <svg viewBox="0 0 100 100" className="w-full h-full p-4 opacity-20">
                <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                <text className="text-[10px] uppercase tracking-[0.2em] font-bold fill-black">
                  <textPath xlinkHref="#circlePath">Professional • Hair • Design • Specialist •</textPath>
                </text>
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 opacity-30">
        <span className="text-[8px] uppercase tracking-[0.4em] font-bold">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-black to-transparent"></div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
      `}} />
    </section>
  );
};

export default Hero;
