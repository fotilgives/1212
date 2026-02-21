import React, { useState } from 'react';

type HairLength = 'short' | 'medium' | 'long';
type HairDensity = 'normal' | 'thick';
type ServiceType = 'complex' | 'toning' | 'exit_black' | 'recovery';

const CareGuide: React.FC = () => {
  const [step, setStep] = useState(1);
  const [hairType, setHairType] = useState('');
  const [problem, setProblem] = useState('');
  const [recommendation, setRecommendation] = useState('');
  
  // Price Estimator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [length, setLength] = useState<HairLength>('medium');
  const [density, setDensity] = useState<HairDensity>('normal');
  const [service, setService] = useState<ServiceType>('complex');

  const handleHairType = (type: string) => {
    setHairType(type);
    setStep(2);
  };

  const handleProblem = (prob: string) => {
    setProblem(prob);
    setRecommendation(getRecommendation(hairType, prob));
    setStep(3);
  };

  const getRecommendation = (type: string, prob: string) => {
    if (type === 'Blonde') {
      if (prob === 'Yellowing') return 'Тонування + Відновлення';
      if (prob === 'Dryness') return 'Кератинове відновлення + Глибоке зволоження';
      if (prob === 'Roots') return 'Корекція коренів + Тонування';
    } else if (type === 'Brunette') {
      if (prob === 'Dullness') return 'Тонування тон в тон для блиску';
      if (prob === 'Redness') return 'Холодне тонування + Нейтралізація';
      if (prob === 'Change') return 'AirTouch або Balayage (Складні техніки)';
    } else { // Natural
      if (prob === 'Change') return 'Складні техніки фарбування (AirTouch)';
      if (prob === 'Dryness') return 'Відновлення волосся (Botox)';
      if (prob === 'Split') return 'Стрижка гарячими ножицями + Догляд';
    }
    return 'Консультація з майстром';
  };

  const calculatePrice = () => {
    let basePrice = 0;
    switch (service) {
      case 'complex': basePrice = 3000; break;
      case 'toning': basePrice = 1200; break;
      case 'exit_black': basePrice = 3500; break;
      case 'recovery': basePrice = 1500; break;
    }
    let lengthMultiplier = 1;
    if (length === 'short') lengthMultiplier = 0.8;
    if (length === 'long') lengthMultiplier = 1.3;
    let densityMultiplier = 1;
    if (density === 'thick') densityMultiplier = 1.2;
    const estimated = Math.round(basePrice * lengthMultiplier * densityMultiplier);
    return Math.ceil(estimated / 100) * 100;
  };

  const price = calculatePrice();

  return (
    <div className="w-full max-w-4xl mx-auto my-16 md:my-24 px-4 md:px-6 bg-neutral-50 rounded-[32px] md:rounded-[40px] p-6 md:p-16 shadow-sm border border-neutral-100">
      <div className="text-center mb-8 md:mb-12">
        <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold block mb-2">Персональний гід</span>
        <h2 className="font-playfair text-3xl md:text-5xl text-neutral-900 mb-4">Яка процедура <span className="italic text-neutral-400">вам підходить?</span></h2>
        <p className="text-neutral-500 max-w-lg mx-auto text-sm font-light leading-relaxed">
          Дайте відповідь на 2 прості запитання, і ми підберемо ідеальну послугу для вашого волосся.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg md:text-xl font-playfair text-center mb-6 md:mb-8">1. Який у вас тип волосся?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <button onClick={() => handleHairType('Blonde')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-50 rounded-full flex items-center justify-center mb-3 md:mb-4 group-hover:bg-black group-hover:text-white transition-colors mx-auto">✨</div>
                <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Блонд</span>
              </button>
              <button onClick={() => handleHairType('Brunette')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-50 rounded-full flex items-center justify-center mb-3 md:mb-4 group-hover:bg-black group-hover:text-white transition-colors mx-auto">🍫</div>
                <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Темне</span>
              </button>
              <button onClick={() => handleHairType('Natural')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-50 rounded-full flex items-center justify-center mb-3 md:mb-4 group-hover:bg-black group-hover:text-white transition-colors mx-auto">🌿</div>
                <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Натуральне</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg md:text-xl font-playfair text-center mb-6 md:mb-8">2. Що вас турбує найбільше?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {hairType === 'Blonde' && (
                <>
                  <button onClick={() => handleProblem('Yellowing')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                    <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Жовтизна</span>
                  </button>
                  <button onClick={() => handleProblem('Dryness')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                    <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Сухість</span>
                  </button>
                  <button onClick={() => handleProblem('Roots')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                    <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Відрослі корені</span>
                  </button>
                </>
              )}
              {hairType === 'Brunette' && (
                <>
                  <button onClick={() => handleProblem('Dullness')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                    <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Тьмяність</span>
                  </button>
                  <button onClick={() => handleProblem('Redness')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                    <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Червоний відтінок</span>
                  </button>
                  <button onClick={() => handleProblem('Change')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                    <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Хочу змін</span>
                  </button>
                </>
              )}
              {hairType === 'Natural' && (
                <>
                  <button onClick={() => handleProblem('Change')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                    <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Хочу змін</span>
                  </button>
                  <button onClick={() => handleProblem('Dryness')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                    <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Сухість</span>
                  </button>
                  <button onClick={() => handleProblem('Split')} className="p-4 md:p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black hover:shadow-lg transition-all group">
                    <span className="font-bold text-xs md:text-sm uppercase tracking-widest block text-center">Посічені кінчики</span>
                  </button>
                </>
              )}
            </div>
            <button onClick={() => setStep(1)} className="mt-6 md:mt-8 text-xs uppercase tracking-widest text-neutral-400 hover:text-black transition-colors block mx-auto">← Назад</button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center animate-in fade-in zoom-in duration-500 bg-white p-6 md:p-10 rounded-[32px] border border-neutral-100 shadow-xl">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl">✨</div>
            <h3 className="text-xs md:text-sm uppercase tracking-[0.3em] text-neutral-400 font-bold mb-3 md:mb-4">Ми рекомендуємо</h3>
            <div className="text-2xl md:text-4xl font-playfair text-neutral-900 mb-6 md:mb-8 leading-tight">{recommendation}</div>
            
            {!showCalculator ? (
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <a href="#contact" className="inline-block bg-black text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg">
                  Записатися
                </a>
                <button onClick={() => setShowCalculator(true)} className="inline-block bg-neutral-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-neutral-700 transition-all shadow-lg">
                  Розрахувати вартість
                </button>
                <button onClick={() => { setStep(1); setHairType(''); setProblem(''); }} className="inline-block bg-white text-black border border-neutral-200 px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-neutral-50 transition-all">
                  Пройти ще раз
                </button>
              </div>
            ) : (
              <div className="mt-8 pt-8 border-t border-neutral-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h4 className="font-playfair text-xl md:text-2xl mb-6">Калькулятор вартості</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 block mb-2">Послуга</label>
                      <select 
                        value={service} 
                        onChange={(e) => setService(e.target.value as ServiceType)}
                        className="w-full p-3 rounded-xl border border-neutral-200 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                      >
                        <option value="complex">Складне фарбування</option>
                        <option value="toning">Тонування</option>
                        <option value="exit_black">Вихід з чорного</option>
                        <option value="recovery">Відновлення</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 block mb-2">Довжина</label>
                      <div className="flex gap-2">
                        {(['short', 'medium', 'long'] as const).map((l) => (
                          <button
                            key={l}
                            onClick={() => setLength(l)}
                            className={`flex-1 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${length === l ? 'bg-black text-white border-black' : 'bg-white text-neutral-500 border-neutral-200'}`}
                          >
                            {l === 'short' ? 'Коротке' : l === 'medium' ? 'Середнє' : 'Довге'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 block mb-2">Густота</label>
                      <div className="flex gap-2">
                        {(['normal', 'thick'] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => setDensity(d)}
                            className={`flex-1 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${density === d ? 'bg-black text-white border-black' : 'bg-white text-neutral-500 border-neutral-200'}`}
                          >
                            {d === 'normal' ? 'Середня' : 'Густе'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-center bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Орієнтовно</span>
                    <div className="font-playfair text-4xl md:text-5xl text-neutral-900 mb-2">
                      {price} <span className="text-xl text-neutral-400 font-light">₴</span>
                    </div>
                    <p className="text-neutral-400 text-[10px] text-center leading-relaxed mb-6">
                      *Точна ціна визначається майстром
                    </p>
                    <a href="#contact" className="w-full bg-black text-white text-center py-3 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg">
                      Записатися
                    </a>
                  </div>
                </div>
                
                <button onClick={() => setShowCalculator(false)} className="mt-6 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors">
                  Приховати калькулятор
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CareGuide;
