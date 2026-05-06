import Navigation from './components/Navigation';
import Hero from './components/Hero';
import WhyDifferent from './components/WhyDifferent';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Comparison from './components/Comparison';
import Stats from './components/Stats';
import Trust from './components/Trust';
import PrivacySection from './components/PrivacySection';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

function App() {
  return (
    <div className="bg-bgPrimary min-h-screen text-textPrimary selection:bg-primary selection:text-white">
      <Navigation />
      <main>
        <Hero />
        <WhyDifferent />
        <HowItWorks />
        <Features />
        <Comparison />
        <Stats />
        <Trust />
        <PrivacySection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;
