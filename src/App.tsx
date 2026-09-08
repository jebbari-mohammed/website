import Navigation from './components/Navigation';
import Hero from './components/Hero';
import EcosystemStrip from './components/EcosystemStrip';
import ProductShowcase from './components/ProductShowcase';
import VoiceCallSection from './components/VoiceCallSection';
import CorePillars from './components/CorePillars';
import TrainerCostCalculator from './components/TrainerCostCalculator';
import Comparison from './components/Comparison';
import Stats from './components/Stats';
import TrustAndPrivacy from './components/TrustAndPrivacy';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

function App() {
  return (
    <div className="bg-[#05080C] min-h-screen text-textPrimary selection:bg-primary selection:text-[#070A0D] font-sans antialiased">
      <Navigation />
      <main>
        <Hero />
        <EcosystemStrip />
        <ProductShowcase />
        <VoiceCallSection />
        <CorePillars />
        <TrainerCostCalculator />
        <Comparison />
        <Stats />
        <TrustAndPrivacy />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;