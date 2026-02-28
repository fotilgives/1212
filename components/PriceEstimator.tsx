import React, { useState } from 'react';

type HairLength = 'short' | 'medium' | 'long';
type HairDensity = 'normal' | 'thick';
type ServiceType = 'complex' | 'toning' | 'exit_black' | 'recovery';

const PriceEstimator: React.FC = () => {
  const [length, setLength] = useState<HairLength>('medium');
  const [density, setDensity] = useState<HairDensity>('normal');
  const [service, setService] = useState<ServiceType>('complex');

  const calculatePrice = () => {
    let basePrice = 0;
    
    // Base prices for services
    switch (service) {
      case 'complex': basePrice = 3500; break;
      case 'toning': basePrice = 1500; break;
      case 'exit_black': basePrice = 4500; break;
      case 'recovery': basePrice = 2000; break;
    }

    // Length multiplier
    let lengthMultiplier = 1;
    if (length === 'short') lengthMultiplier = 0.8;
    if (length === 'long') lengthMultiplier = 1.3;

    // Density multiplier
    let densityMultiplier = 1;
    if (density === 'thick') densityMultiplier = 1.2;

    const estimated = Math.round(basePrice * lengthMultiplier * densityMultiplier);
    // Round to nearest 100
    return Math.ceil(estimated / 100) * 100;
  };

  const price = calculatePrice();

  return (
    <section className="py-24 px-6 md:px-8 bg-neutral-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold block mb-4">Калькулятор</span>
          <h2 className="font-playfair text-4xl md:text-5xl text-neutral-900 mb-6">Розрахунок <span className="italic text-neutral-400">вартості</span></h2>
          <p className="text-neutral-500 max-w-lg mx-auto text-sm font-light leading-relaxed">
            Оберіть параметри вашого волосся та бажану послугу, щоб дізнатися орієнтовну вартість.
          </p>
        </div>

        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-neutral-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Controls */}
            <div className="space-y-8">
              
              {/* Service */}
              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 block mb-4">Послуга</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'complex', label: 'Складне фарбування' },
                    { id: 'toning', label: 'Тонування' },
                    { id: 'exit_black', label: 'Вихід з чорного' },
                    { id: 'recovery', label: 'Відновлення' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setService(opt.id as ServiceType)}
                      className={`w-full text-left px-6 py-4 rounded-xl border transition-all ${
                        service === opt.id 
                        ? 'border-black bg-black text-white shadow-lg' 
                        : 'border-neutral-100 bg-white text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      <span className="font-medium text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 block mb-4">Довжина волосся</label>
                <div className="flex gap-3">
                  {[
                    { id: 'short', label: 'Коротке' },
                    { id: 'medium', label: 'Середнє' },
                    { id: 'long', label: 'Довге' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setLength(opt.id as HairLength)}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                        length === opt.id 
                        ? 'border-black bg-black text-white' 
                        : 'border-neutral-100 bg-white text-neutral-500 hover:border-neutral-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Density */}
              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 block mb-4">Густота</label>
                <div className="flex gap-3">
                  {[
                    { id: 'normal', label: 'Середня' },
                    { id: 'thick', label: 'Густе' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setDensity(opt.id as HairDensity)}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                        density === opt.id 
                        ? 'border-black bg-black text-white' 
                        : 'border-neutral-100 bg-white text-neutral-500 hover:border-neutral-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Result */}
            <div className="flex flex-col justify-center items-center bg-neutral-50 rounded-[24px] p-8 border border-neutral-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/></svg>
              </div>
              
              <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold mb-6 relative z-10">Орієнтовна вартість</span>
              
              <div className="text-center relative z-10">
                <div className="font-playfair text-6xl md:text-7xl text-neutral-900 mb-2">
                  {price} <span className="text-2xl md:text-3xl text-neutral-400 font-light">₴</span>
                </div>
                <p className="text-neutral-400 text-xs mt-4 max-w-[200px] mx-auto leading-relaxed">
                  *Це приблизна вартість. Точна ціна визначається майстром після консультації.
                </p>
              </div>

              <div className="mt-12 w-full relative z-10">
                <a href="#contact" className="block w-full bg-black text-white text-center py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg">
                  Записатися
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceEstimator;
