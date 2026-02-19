
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-neutral-100 py-24 px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
        <div className="space-y-8 max-w-sm">
          <div className="font-playfair text-2xl tracking-[0.2em] uppercase font-bold text-neutral-900">
            Світлана Мазур
          </div>
          <p className="text-neutral-400 text-sm font-light leading-relaxed">
            Ми створюємо не просто красу, ми створюємо впевненість. Ваш стиль — це ваше відображення у світі. Дозвольте йому бути бездоганним.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-16 md:gap-24">
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-neutral-900">Навігація</h4>
            <ul className="space-y-4 text-xs text-neutral-400 font-medium">
              <li><a href="#about" className="hover:text-black transition-all">Про мене</a></li>
              <li><a href="#services" className="hover:text-black transition-all">Послуги</a></li>
              <li><a href="#gallery" className="hover:text-black transition-all">Портфоліо</a></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-neutral-900">Соцмережі</h4>
            <ul className="space-y-4 text-xs text-neutral-400 font-medium">
              <li>
                <a 
                  href="https://www.instagram.com/svet.mazur.hair?igsh=MTY4b2RqdGs0Yzc4cQ==" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-black transition-all flex items-center gap-2"
                >
                  Instagram
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-neutral-900">Зв'язок</h4>
            <ul className="space-y-4 text-xs text-neutral-400 font-medium">
              <li>+380 97 911 20 15</li>
              <li>Вінниця, вул. Князів Коріатовичів, 106, 21000</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-neutral-50 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] uppercase tracking-[0.4em] text-neutral-300 font-bold">
        <div>© 2026 SVETLANA MAZUR. ALL RIGHTS RESERVED.</div>
        <div className="flex space-x-10">
          <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-black transition-colors">Terms of Use</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
