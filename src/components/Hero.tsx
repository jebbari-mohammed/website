import { useEffect, useRef, useState } from 'react';
import { motion } from '../lib/motion';
import { ArrowRight, CheckCircle2, MessageSquare, Dumbbell } from 'lucide-react';
import heroPreviewMedia from '../content/hero-preview-media.json';

export default function Hero() {
  const [activeVideo, setActiveVideo] = useState<'chat' | 'workout'>('chat');
  const [showMotionPreview, setShowMotionPreview] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 768px)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inViewport = false;
    const syncPreviewMode = () => {
      setShowMotionPreview(inViewport && desktopQuery.matches && !reducedMotionQuery.matches);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      syncPreviewMode();
    });
    if (sectionRef.current) observer.observe(sectionRef.current);

    syncPreviewMode();
    desktopQuery.addEventListener?.('change', syncPreviewMode);
    reducedMotionQuery.addEventListener?.('change', syncPreviewMode);

    return () => {
      observer.disconnect();
      desktopQuery.removeEventListener?.('change', syncPreviewMode);
      reducedMotionQuery.removeEventListener?.('change', syncPreviewMode);
    };
  }, []);

  const previewMedia = heroPreviewMedia[activeVideo === 'chat' ? 0 : 1];
  const previewImage = `${previewMedia.posterPath}?v=${previewMedia.posterSha256.slice(0, 12)}`;
  const previewAlt =
    activeVideo === 'chat'
      ? 'IZEM AI coach chat interface preview'
      : 'IZEM workout and nutrition interface preview';

  const companionMedia = heroPreviewMedia[activeVideo === 'chat' ? 1 : 0];
  const companionImage = `${companionMedia.posterPath}?v=${companionMedia.posterSha256.slice(0, 12)}`;

  return (
    <section ref={sectionRef} id="hero" className="athletic-hero">
      <div className="editorial-container">
        <div className="athletic-hero-layout">
          <div className="athletic-hero-copy">
            <p className="athletic-hero-status"><span aria-hidden="true" />App awaiting store review</p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="athletic-hero-heading">
              <span className="athletic-wordmark">IZEM.</span>{' '}
              <span className="athletic-hero-title">Your AI Personal Trainer</span>
            </motion.h1>
            <p className="athletic-hero-summary">
              Workouts, meals and coaching that share the same context. IZEM connects weekly plans, training logs, progress, AI chat and eligible voice calls around one profile.
            </p>
            <p className="athletic-hero-note">
              The IZEM app is awaiting store review. While you wait, build a starting plan with the free workout generator on this website.
            </p>
            <div className="athletic-hero-actions">
              <a href="/workout-plan-generator/" className="editorial-button athletic-primary-action">
                <span>Try the free workout generator</span><ArrowRight aria-hidden="true" size={18} />
              </a>
              <a href="#capabilities" className="editorial-link">Explore the app’s features</a>
            </div>
            <div className="athletic-hero-proof">
              {['Workout plans & logs', 'Meals & grocery lists', 'Chat & eligible voice calls'].map((label) => <span key={label}><CheckCircle2 aria-hidden="true" size={15} />{label}</span>)}
            </div>
          </div>
          <div className="athletic-hero-preview">
            <div className="athletic-preview-controls" role="group" aria-label="Choose a feature preview">
              <button type="button" onClick={() => setActiveVideo('chat')} aria-pressed={activeVideo === 'chat'}><MessageSquare aria-hidden="true" size={15} />Coaching context</button>
              <button type="button" onClick={() => setActiveVideo('workout')} aria-pressed={activeVideo === 'workout'}><Dumbbell aria-hidden="true" size={15} />Workout planning</button>
            </div>
            <div className="athletic-preview-stage">
              <svg className="athletic-stage-mark" viewBox="0 0 120 200" aria-hidden="true"><path d="M66 0H118L75 76H115L18 200L47 105H0Z" /></svg>
              <img className="athletic-preview-companion" src={companionImage} alt="" aria-hidden="true" width="560" height="882" loading="lazy" decoding="async" />
              <div className="athletic-preview-main">
                {showMotionPreview ? (
                  <video
                    data-izem-hero-preview="true"
                    key={activeVideo}
                    src={previewMedia.videoPath}
                    poster={previewImage}
                    aria-label={previewAlt}
                    autoPlay loop muted playsInline preload="metadata"
                  >Your browser does not support HTML5 video.</video>
                ) : (
                  <img
                    data-izem-hero-preview="true"
                    src={previewImage} alt={previewAlt}
                    width="800" height="1260" loading="eager"
                    decoding="async" fetchPriority="high"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
