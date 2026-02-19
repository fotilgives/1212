
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-neutral-100 py-16 px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-6 max-w-sm">
          <div className="font-playfair text-2xl tracking-widest uppercase font-semibold">
            Світлана Мазур
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Мистецтво краси, втілене у професіоналізмі та індивідуальному підході. Кожен образ — це нова історія досконалості.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-900">Навігація</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><a href="#about" className="hover:text-black transition-colors">Про мене</a></li>
              <li><a href="#services" className="hover:text-black transition-colors">Послуги</a></li>
              <li><a href="#gallery" className="hover:text-black transition-colors">Портфоліо</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-900">Соціальні мережі</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><a href="#" className="hover:text-black transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Telegram</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-900">Контакти</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li>+380 97 911 20 15</li>
              <li>Vinnytsia, Ukraine</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-neutral-50 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-neutral-400">
        <div>© 2024 Світлана Мазур. Усі права захищено.</div>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-black transition-colors">Політика конфіденційності</a>
          <a href="#" className="hover:text-black transition-colors">Терміни та умови</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
