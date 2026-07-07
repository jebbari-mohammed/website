import Navigation from './components/Navigation';
import Hero from './components/Hero';
import CallLoop from './components/CallLoop';
import WhyDifferent from './components/WhyDifferent';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Comparison from './components/Comparison';
import Stats from './components/Stats';
import Trust from './components/Trust';
import PrivacySection from './components/PrivacySection';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import MarketingDashboard from '../apps/dashboard/src/MarketingDashboard';

function App() {
  if (window.location.pathname.startsWith('/marketing-dashboard')) {
    return <MarketingDashboard />;
  }

  return (
    <div className="bg-bgPrimary min-h-screen text-textPrimary selection:bg-primary selection:text-white">
      <Navigation />
      <main>
        <Hero />
        <CallLoop />
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
