import MarketingDashboard from '../apps/dashboard/src/MarketingDashboard';
import LegalLanding from './components/LegalLanding';

function App() {
  if (window.location.pathname.startsWith('/marketing-dashboard')) {
    return <MarketingDashboard />;
  }

  return <LegalLanding />;
}

export default App;
