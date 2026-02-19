
import React from 'react';

const galleryImages = [
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=1287&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?q=80&w=1470&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1470&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=1287&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?q=80&w=1470&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492150165819-345a80252b1e?q=80&w=1227&auto=format&fit=crop"
];

const Gallery: React.FC = () => {
  return (
    <section id="gallery" className="py-24 px-8 bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[10px] tracking-[0.4em] text-neutral-500 uppercase font-bold">Portfolio</span>
          <h2 className="font-playfair text-5xl md:text-6xl italic">Вибрані роботи</h2>
          <div className="w-12 h-[1px] bg-neutral-700 mx-auto mt-6"></div>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {galleryImages.map((src, index) => (
            <div key={index} className="relative group overflow-hidden rounded-[32px] bg-neutral-900 break-inside-avoid">
              <img 
                src={src} 
                alt={`Work ${index + 1}`}
                className="w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-100 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
                 <div className="text-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-[10px] uppercase tracking-widest font-bold border-b border-white/50 pb-1">Переглянути</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-20 text-center">
           <a href="https://instagram.com" className="inline-flex items-center space-x-3 text-neutral-400 hover:text-white transition-colors group">
              <span className="text-xs uppercase tracking-widest font-bold">Більше в Instagram</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
           </a>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
