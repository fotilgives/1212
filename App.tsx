
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import Gallery from './components/Gallery';
import Contact from './components/Contact';
import Footer from './components/Footer';

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-pink-100 selection:text-pink-900 bg-white">
      {/* Background aesthetics */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-pink-50/40 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-10%] left-[-20%] w-[50%] h-[50%] bg-neutral-100 rounded-full blur-[130px]"></div>
      </div>

      <Navbar scrolled={scrolled} />
      
      <main>
        <Hero />
        <About />
        <Services />
        <Gallery />
        <Contact />
      </main>

      <Footer />
    </div>
  );
};

export default App;
