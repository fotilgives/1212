
import React, { useState, useEffect } from 'react';

// --- Smart Image Component for HEIC Support ---
const SmartImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if URL ends with .heic (case insensitive)
    if (src.toLowerCase().endsWith('.heic')) {
      setLoading(true);
      fetch(src)
        .then((res) => res.blob())
        .then((blob) => {
          // @ts-ignore - heic2any is loaded via CDN in index.html
          if (window.heic2any) {
            // @ts-ignore
            return window.heic2any({
              blob,
              toType: 'image/jpeg',
              quality: 0.8
            });
          }
          throw new Error('heic2any library not found');
        })
        .then((conversionResult) => {
          const url = URL.createObjectURL(Array.isArray(conversionResult) ? conversionResult[0] : conversionResult);
          setImgSrc(url);
          setLoading(false);
        })
        .catch((err) => {
          console.error('HEIC conversion failed', err);
          // Fallback to original if conversion fails, though browser likely won't render it
          setImgSrc(src);
          setLoading(false);
        });
    } else {
        setImgSrc(src);
    }
  }, [src]);

  return (
    <div className="w-full h-full relative overflow-hidden">
        {loading && (
            <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}
        <img 
            src={imgSrc} 
            alt={alt} 
            className={className} 
            style={{ imageRendering: 'high-quality' as any }}
        />
    </div>
  );
};

// --- Data ---
const portfolioPairs = [
  {
    before: "https://image2url.com/r2/default/images/1771533294619-7e0338a6-3e31-46b7-91d0-0220980d233e.jpg",
    after: "https://image2url.com/r2/default/images/1771533312057-5241381a-7df6-49bf-8a5c-7435f172cc56.jpg"
  },
  {
    before: "https://image2url.com/r2/default/images/1771533560562-aaf5b9f7-f3af-4cdf-977a-4eca39994b21.jpg",
    after: "https://image2url.com/r2/default/images/1771533585866-36d8b649-644a-4e08-a65b-bd54430c1e61.jpg"
  },
  {
    // HEIC Files
    before: "https://image2url.com/r2/default/images/1771533636082-f3064c73-ee3d-44e9-ac67-9dfdcacce715.heic",
    after: "https://image2url.com/r2/default/images/1771533670833-15f2230d-2349-4382-b4f9-0b82472361be.heic"
  }
];

const Gallery: React.FC = () => {
  return (
    <section id="gallery" className="py-24 px-6 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto space-y-20">
        
        <div className="text-center space-y-6">
          <span className="text-[10px] tracking-[0.6em] text-neutral-400 uppercase font-bold">Результати</span>
          <h2 className="font-playfair text-5xl md:text-7xl font-medium text-neutral-900">Портфоліо: <span className="italic text-neutral-400">До та Після</span></h2>
        </div>

        <div className="space-y-16">
          {portfolioPairs.map((pair, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 items-center">
               
               {/* Before */}
               <div className="relative group rounded-[32px] overflow-hidden shadow-2xl bg-neutral-100 aspect-[3/4] md:aspect-[4/5]">
                  <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest text-neutral-800 shadow-sm">
                      До
                  </div>
                  <SmartImage 
                    src={pair.before} 
                    alt={`Before ${index}`} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
               </div>

               {/* After */}
               <div className="relative group rounded-[32px] overflow-hidden shadow-2xl bg-neutral-100 aspect-[3/4] md:aspect-[4/5] ring-1 ring-black/5">
                  <div className="absolute top-6 left-6 z-10 bg-neutral-900 text-white px-4 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest shadow-sm">
                      Після
                  </div>
                  <SmartImage 
                    src={pair.after} 
                    alt={`After ${index}`} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
               </div>

            </div>
          ))}
        </div>
        
        <div className="mt-24 text-center">
           <a 
             href="https://www.instagram.com/svet.mazur.hair?igsh=MTY4b2RqdGs0Yzc4cQ==" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="inline-flex items-center space-x-6 text-neutral-500 hover:text-black transition-all group"
           >
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Більше в Instagram</span>
              <div className="w-12 h-12 rounded-full border border-neutral-200 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
           </a>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
