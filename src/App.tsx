import { useEffect } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import EcosystemStrip from './components/EcosystemStrip';
import ProductShowcase from './components/ProductShowcase';
import Capabilities from './components/Capabilities';
import VoiceCallSection from './components/VoiceCallSection';
import CorePillars from './components/CorePillars';
import TrainerCostCalculator from './components/TrainerCostCalculator';
import Comparison from './components/Comparison';
import Stats from './components/Stats';
import TrustAndPrivacy from './components/TrustAndPrivacy';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

const DEMO_VIDEO_START_SECONDS = 3;
const HOMEPAGE_DEMO_VIDEO_NAMES = [
  'izem-coach-chat-dark-web.mp4',
  'izem-workout-nutrition-dark-web.mp4',
];

function App() {
  useEffect(() => {
    const attachedVideos = new Map<
      HTMLVideoElement,
      { loadedMetadata: () => void; ended: () => void }
    >();

    const isHomepageDemoVideo = (video: HTMLVideoElement) => {
      const source = video.currentSrc || video.getAttribute('src') || '';
      return HOMEPAGE_DEMO_VIDEO_NAMES.some((name) => source.includes(name));
    };

    const getStartTime = (video: HTMLVideoElement) => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return DEMO_VIDEO_START_SECONDS;
      }

      return Math.min(DEMO_VIDEO_START_SECONDS, Math.max(0, video.duration - 0.25));
    };

    const playFromTrimmedStart = (video: HTMLVideoElement) => {
      const startTime = getStartTime(video);
      if (Math.abs(video.currentTime - startTime) > 0.05) {
        video.currentTime = startTime;
      }

      const playPromise = video.play();
      if (playPromise) {
        void playPromise.catch(() => {
          // Muted autoplay is normally allowed; if the browser still blocks it,
          // the next user interaction can resume from the same trimmed start.
        });
      }
    };

    const attachDemoBehavior = (video: HTMLVideoElement) => {
      if (attachedVideos.has(video) || !isHomepageDemoVideo(video)) return;

      // The source recordings contain a quiet opening. Disable native looping so
      // every repeat also returns to the useful part of the recording, not 0:00.
      video.loop = false;
      video.preload = 'auto';

      const loadedMetadata = () => playFromTrimmedStart(video);
      const ended = () => playFromTrimmedStart(video);

      video.addEventListener('loadedmetadata', loadedMetadata);
      video.addEventListener('ended', ended);
      attachedVideos.set(video, { loadedMetadata, ended });

      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        playFromTrimmedStart(video);
      }
    };

    const scanForDemoVideos = (root: ParentNode) => {
      if (root instanceof HTMLVideoElement) {
        attachDemoBehavior(root);
      }

      root.querySelectorAll?.('video').forEach((video) => {
        attachDemoBehavior(video as HTMLVideoElement);
      });
    };

    scanForDemoVideos(document);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            scanForDemoVideos(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      attachedVideos.forEach(({ loadedMetadata, ended }, video) => {
        video.removeEventListener('loadedmetadata', loadedMetadata);
        video.removeEventListener('ended', ended);
      });
      attachedVideos.clear();
    };
  }, []);

  return (
    <div className="bg-[#05080C] min-h-screen text-textPrimary selection:bg-primary selection:text-[#070A0D] font-sans antialiased">
      <Navigation />
      <main>
        <Hero />
        <EcosystemStrip />
        <ProductShowcase />
        <Capabilities />
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
