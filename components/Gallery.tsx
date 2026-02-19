
import React from 'react';

const galleryImages = [
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492150165819-345a80252b1e?q=80&w=1200&auto=format&fit=crop"
];

const Gallery: React.FC = () => {
  return (
    <section id="gallery" className="py-24 px-8 bg-neutral-900 text-white rounded-[60px] mx-4 my-8 md:mx-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-6">
          <span className="text-[10px] tracking-[0.6em] text-neutral-500 uppercase font-bold">Selected Works</span>
          <h2 className="font-playfair text-5xl md:text-7xl italic font-light">Портфоліо</h2>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {galleryImages.map((src, index) => (
            <div key={index} className="relative group overflow-hidden rounded-[40px] bg-neutral-800 break-inside-avoid shadow-2xl">
              <img 
                src={src} 
                alt={`Work ${index + 1}`}
                className="w-full h-auto object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 scale-100 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-10">
                 <span className="text-[10px] uppercase tracking-[0.4em] font-bold border-b border-white/30 pb-2">Переглянути проект</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-24 text-center">
           <a href="#" className="inline-flex items-center space-x-6 text-neutral-500 hover:text-white transition-all group">
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Більше в Instagram</span>
              <div className="w-12 h-12 rounded-full border border-neutral-700 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
           </a>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
