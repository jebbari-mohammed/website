import Navigation from './components/Navigation';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Trust from './components/Trust';
import PrivacySection from './components/PrivacySection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="bg-bgPrimary min-h-screen text-textPrimary selection:bg-primary selection:text-white">
      <Navigation />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Trust />
        <PrivacySection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
