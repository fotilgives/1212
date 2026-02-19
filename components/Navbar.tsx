
import React, { useState } from 'react';

interface NavbarProps {
  scrolled: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ scrolled }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 py-4 px-6 md:px-16 ${scrolled || isMobileMenuOpen ? 'glass-nav shadow-sm bg-white/80' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="font-playfair text-xl md:text-2xl tracking-widest uppercase font-semibold z-50 relative">
            Світлана Мазур
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-12 text-xs font-medium tracking-[0.2em] uppercase">
            <a href="#about" className="hover:text-pink-600 transition-colors">Про мене</a>
            <a href="#services" className="hover:text-pink-600 transition-colors">Послуги</a>
            <a href="#gallery" className="hover:text-pink-600 transition-colors">Портфоліо</a>
            <a href="#contact" className="hover:text-pink-600 transition-colors">Контакти</a>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <a href="#contact" className="bg-black text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all">
              Записатися
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden z-50 p-2 text-neutral-800 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span className={`w-full h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-full h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-full h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white z-40 transition-transform duration-500 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden flex flex-col items-center justify-center`}>
        <div className="flex flex-col space-y-8 text-center font-playfair text-2xl">
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-pink-600 transition-colors">Про мене</a>
          <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-pink-600 transition-colors">Послуги</a>
          <a href="#gallery" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-pink-600 transition-colors">Портфоліо</a>
          <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-pink-600 transition-colors">Контакти</a>
        </div>
        <div className="mt-12">
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="bg-black text-white px-10 py-4 rounded-full text-sm font-bold uppercase tracking-wider shadow-xl">
              Записатися
            </a>
        </div>
      </div>
    </>
  );
};

export default Navbar;
