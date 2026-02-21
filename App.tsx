
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import Gallery from './components/Gallery';
import Contact from './components/Contact';
import Footer from './components/Footer';
import CareGuide from './components/CareGuide';
import BeforeAfterSlider from './components/BeforeAfterSlider';
import VisitPrep from './components/VisitPrep';
import PriceEstimator from './components/PriceEstimator';

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
      <Navbar scrolled={scrolled} />
      
      <main>
        <Hero />
        <About />
        <Services />
        <CareGuide />
        <Gallery />
        <VisitPrep />
        <Contact />
      </main>

      <Footer />
    </div>
  );
};

export default App;
