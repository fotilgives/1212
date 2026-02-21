
import React, { useState } from 'react';

interface NavbarProps {
  scrolled: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ scrolled }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Про мене', href: '#about' },
    { name: 'Послуги', href: '#services' },
    { name: 'Портфоліо', href: '#gallery' },
    { name: 'Контакти', href: '#contact' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 py-6 px-6 md:px-16 ${scrolled || isMobileMenuOpen ? 'glass-nav shadow-[0_4px_30px_rgba(0,0,0,0.03)]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="#" className="font-playfair text-xl md:text-2xl tracking-[0.2em] uppercase font-bold z-50 relative group">
            Світлана Мазур
            <span className="block h-[1px] w-0 group-hover:w-full bg-black transition-all duration-500"></span>
          </a>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-12 text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-500">
            <a href="#about" className="hover:text-black transition-all duration-300 relative group">Про мене<span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full"></span></a>
            <a href="#services" className="hover:text-black transition-all duration-300 relative group">Послуги<span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full"></span></a>
            <a href="#gallery" className="hover:text-black transition-all duration-300 relative group">Портфоліо<span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full"></span></a>
            <a href="#contact" className="hover:text-black transition-all duration-300 relative group">Контакти<span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full"></span></a>
          </div>

          <div className="hidden md:block">
            <a href="#contact" className="bg-black text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-black/5">
              ЗАПИСАТИСЯ
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden z-50 p-2 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <div className="w-6 h-4 relative flex flex-col justify-between">
              <span className={`w-full h-[1.5px] bg-black transition-all duration-500 ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}></span>
              <span className={`w-full h-[1.5px] bg-black transition-all duration-500 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-full h-[1.5px] bg-black transition-all duration-500 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}></span>
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white/98 backdrop-blur-md z-40 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-10'} md:hidden flex flex-col items-center justify-center`}>
        <div className="flex flex-col space-y-10 text-center font-playfair text-3xl italic">
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-900 hover:text-neutral-400 transition-colors">Про мене</a>
            <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-900 hover:text-neutral-400 transition-colors">Послуги</a>
            <a href="#gallery" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-900 hover:text-neutral-400 transition-colors">Портфоліо</a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-900 hover:text-neutral-400 transition-colors">Контакти</a>
        </div>
        <div className="mt-16">
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="bg-black text-white px-12 py-5 rounded-full text-xs font-bold uppercase tracking-widest shadow-2xl">
              ЗАПИСАТИСЯ
            </a>
        </div>
      </div>
    </>
  );
};

export default Navbar;
