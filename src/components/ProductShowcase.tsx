import { useEffect, useRef, useState } from 'react';
import { motion } from '../lib/motion';
import heroPreviewMedia from '../content/hero-preview-media.json';
import { Dumbbell, MessageSquare, Phone, ArrowRight, CheckCircle, Flame, ScanLine, Activity, ShoppingBasket, ShieldCheck, type LucideIcon } from 'lucide-react';

interface ShowcaseTab {
  id: 'workout' | 'nutrition' | 'chat';
  title: string;
  badge: string;
  videoSrc: string;
  headline: string;
  description: string;
  features: {
    icon: LucideIcon;
    title: string;
    desc: string;
  }[];
  ctaText: string;
  ctaLink: string;
}

const tabs: ShowcaseTab[] = [
  {
    id: 'workout',
    title: 'Adaptive Workouts',
    badge: 'Training Inputs & Logs',
    videoSrc: heroPreviewMedia[1].videoPath,
    headline: 'Workouts designed for your real gym, not an ideal world.',
    description: 'Sessions use the equipment, schedule, experience, session length and feedback you provide, with video references when available.',
    features: [
      {
        icon: Dumbbell,
        title: 'Exercise Demonstrations',
        desc: 'Video references and practical setup cues help you understand planned movements. Stop if a movement causes pain.',
      },
      {
        icon: Activity,
        title: 'Exercise Substitutions',
        desc: 'When an exercise does not fit your equipment or situation, supported swaps aim to preserve the intended muscle group and movement pattern.',
      },
      {
        icon: Flame,
        title: 'Sets, Reps & Load History',
        desc: 'Log working sets, repetitions, load and effort so future coaching can use what you actually completed instead of guessing.',
      },
    ],
    ctaText: 'Explore Adaptive Workouts',
    ctaLink: '/features/ai-workout-generator',
  },
  {
    id: 'nutrition',
    title: 'Personalized Nutrition',
    badge: 'Plans + Grocery List',
    videoSrc: heroPreviewMedia[1].videoPath,
    headline: 'A meal plan that stays connected to the rest of your coaching.',
    description: 'IZEM can build meal plans around your dietary preferences, allergies, meal count and calorie/macro targets, then keep meals, logs and grocery items in the same workflow.',
    features: [
      {
        icon: ShoppingBasket,
        title: 'Generated Grocery List',
        desc: 'The active meal plan produces a grocery list you can use and update inside the nutrition experience.',
      },
      {
        icon: CheckCircle,
        title: 'Supported Meal Changes',
        desc: 'Replace or adjust supported meals while keeping your preferences, allergies and nutrition targets in context.',
      },
      {
        icon: ScanLine,
        title: 'Food Photo Estimates',
        desc: 'Scan a plate for estimated calories and macros. The result is an estimate, so ingredient labels still matter for allergies and medical diets.',
      },
    ],
    ctaText: 'See the AI Meal Planner',
    ctaLink: '/features/ai-meal-planner',
  },
  {
    id: 'chat',
    title: 'Coach Chat & Calls',
    badge: 'Shared Coaching Context',
    videoSrc: heroPreviewMedia[0].videoPath,
    headline: 'Chat with the coach, call it, or let it call you when you enable that flow.',
    description: 'IZEM can use relevant workout, meal, progress and saved coaching context during supported conversations. Larger plan changes still stay under user control.',
    features: [
      {
        icon: MessageSquare,
        title: 'Continuing AI Coach Chat',
        desc: 'Text conversations can use current plans, logged progress and useful saved preferences instead of treating every message as a fresh account.',
      },
      {
        icon: Phone,
        title: 'User-Initiated & Proactive Calls',
        desc: 'Premium members can start a live coach call, while optional coach-initiated calls can support workout reminders and review moments when enabled.',
      },
      {
        icon: ShieldCheck,
        title: 'Optional Apple Health Context',
        desc: 'On supported iPhones, a bounded Health summary can support eligible text coaching and requested workout changes after separate consent. Voice calls do not receive Health context.',
      },
    ],
    ctaText: 'How Voice Calls Work',
    ctaLink: '/fitness-app-that-calls-you/',
  },
];

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab['id']>('workout');
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [readyVideo, setReadyVideo] = useState<string | null>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = tabs.find((t) => t.id === activeTab) || tabs[0];
  const posterMedia = heroPreviewMedia[current.id === 'chat' ? 0 : 1];
  const poster = `${posterMedia.posterPath}?v=${posterMedia.posterSha256.slice(0, 12)}`;

  useEffect(() => {
    const frame = videoFrameRef.current;
    if (!frame) return;

    if (typeof IntersectionObserver === 'undefined') {
      const fallbackTimer = window.setTimeout(() => setShouldLoadVideo(true), 0);
      return () => window.clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const frame = videoFrameRef.current;
    if (!video || !frame) return;

    let cancelled = false;
    const isInViewport = () => {
      const bounds = frame.getBoundingClientRect();
      return bounds.bottom > 0 && bounds.top < window.innerHeight &&
        bounds.right > 0 && bounds.left < window.innerWidth;
    };
    let inViewport = isInViewport();
    const canPlay = () => !cancelled && inViewport && !document.hidden;
    const syncPlayback = () => {
      if (!canPlay()) {
        video.pause();
        return;
      }
      void video.play().then(() => {
        // A scroll, source change or background tab can race media startup.
        if (!canPlay()) video.pause();
      }).catch(() => {
        // Keep the matching still visible if the browser blocks playback.
      });
    };
    const observer = typeof IntersectionObserver === 'undefined' ? null :
      new IntersectionObserver(([entry]) => {
        inViewport = entry.isIntersecting && entry.intersectionRatio > 0;
        syncPlayback();
      }, { threshold: [0, 0.01] });
    const syncFallbackViewport = () => {
      inViewport = isInViewport();
      syncPlayback();
    };

    observer?.observe(frame);
    if (!observer) {
      window.addEventListener('scroll', syncFallbackViewport, { passive: true });
      window.addEventListener('resize', syncFallbackViewport);
    }
    document.addEventListener('visibilitychange', syncPlayback);
    syncPlayback();
    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener('scroll', syncFallbackViewport);
      window.removeEventListener('resize', syncFallbackViewport);
      document.removeEventListener('visibilitychange', syncPlayback);
      video.pause();
    };
  }, [shouldLoadVideo, current.videoSrc]);

  return (
    <section id="showcase" className="editorial-section editorial-showcase">
      <div className="editorial-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="editorial-section-heading"
        >
          <p className="editorial-eyebrow">EXPLORE THE FEATURES</p>
          <h2 className="editorial-title">See the Connected Coaching System.</h2>
          <p className="editorial-intro">
            Select a capability to see how training, nutrition and coach conversations fit together instead of living in separate apps.
          </p>
        </motion.div>

        <div className="editorial-showcase-tabs" role="group" aria-label="Coaching capabilities">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={isActive}
                className={`editorial-showcase-tab${isActive ? ' is-active' : ''}`}
              >
                {tab.title}
              </button>
            );
          })}
        </div>

        <div className="editorial-showcase-layout">
          <div className="editorial-showcase-media">
            <div ref={videoFrameRef} className="editorial-showcase-frame">
              <img
                src={poster}
                alt={`${current.title} in the IZEM app`}
                width="800"
                height="1260"
                loading="lazy"
                decoding="async"
                className="editorial-showcase-poster"
              />
              {shouldLoadVideo && (
                <video
                  key={current.videoSrc}
                  ref={videoRef}
                  src={current.videoSrc}
                  poster={poster}
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                  onLoadStart={() => setReadyVideo(null)}
                  onPlaying={() => setReadyVideo(current.videoSrc)}
                  onError={() => setReadyVideo(null)}
                  className={`editorial-showcase-recording${readyVideo === current.videoSrc ? ' is-ready' : ''}`}
                />
              )}
            </div>
          </div>

          <div className="editorial-showcase-content">
            <p className="editorial-eyebrow">{current.badge}</p>
            <h3 className="editorial-showcase-headline">{current.headline}</h3>
            <p className="editorial-showcase-description">{current.description}</p>

            <ul className="editorial-showcase-features">
              {current.features.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <li key={idx} className="editorial-showcase-feature">
                    <Icon size={20} className="editorial-showcase-icon" aria-hidden="true" />
                    <div>
                      <h4 className="editorial-showcase-feature-title">{item.title}</h4>
                      <p className="editorial-showcase-feature-description">{item.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <a href={current.ctaLink} className="editorial-link">
              <span>{current.ctaText}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
