import React, { useState, useRef, useEffect } from 'react';

interface BeforeAfterProps {
  beforeImage: string;
  afterImage: string;
}

// Helper hook for HEIC conversion
const useHeicImage = (src: string) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (src.toLowerCase().endsWith('.heic')) {
      setLoading(true);
      fetch(src)
        .then((res) => res.blob())
        .then((blob) => {
          // @ts-ignore
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
          setImgSrc(src);
          setLoading(false);
        });
    } else {
      setImgSrc(src);
    }
  }, [src]);

  return { imgSrc, loading };
};

const BeforeAfterSlider: React.FC<BeforeAfterProps> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { imgSrc: finalBefore, loading: loadingBefore } = useHeicImage(beforeImage);
  const { imgSrc: finalAfter, loading: loadingAfter } = useHeicImage(afterImage);
  
  const isLoading = loadingBefore || loadingAfter;

  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : (event as React.MouseEvent).clientX;
    
    let position = ((clientX - containerRect.left) / containerRect.width) * 100;
    position = Math.max(0, Math.min(100, position));
    
    setSliderPosition(position);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isDragging && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            let position = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            position = Math.max(0, Math.min(100, position));
            setSliderPosition(position);
        }
    };

    if (isDragging) {
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging]);

  return (
    <div className="w-full max-w-4xl mx-auto my-16 px-4">
      <div 
        ref={containerRef}
        className="relative w-full aspect-[3/4] md:aspect-[3/4] max-w-[600px] mx-auto overflow-hidden rounded-[32px] cursor-ew-resize select-none shadow-2xl bg-neutral-100"
        onMouseMove={!isDragging ? (e) => handleMove(e) : undefined}
        onTouchMove={handleMove}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {isLoading && (
            <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center z-20">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}

        {/* After Image (Background) */}
        <img 
          src={finalAfter} 
          alt="After" 
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Before Image (Foreground, clipped) */}
        <div 
          className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img 
            src={finalBefore} 
            alt="Before" 
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8M8 17h8M12 7v10" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest pointer-events-none z-10">
          До
        </div>
        <div className="absolute top-6 right-6 bg-white/80 backdrop-blur-md text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest pointer-events-none z-10">
          Після
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
