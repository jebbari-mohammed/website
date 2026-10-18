import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import './OpeningVideo.css';

const mediaFor = (mobile: boolean) => ({
  video: `/videos/intro/izem-unfair-advantage-${mobile ? 'mobile' : 'desktop'}-v1.mp4`,
  poster: `/images/intro/izem-unfair-advantage-${mobile ? 'mobile' : 'desktop'}-v1.webp`,
});

type Connection = { saveData?: boolean };

export default function OpeningVideo({ onVisibilityChange }: { onVisibilityChange: (visible: boolean) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const visibleRef = useRef(true);
  const manualPauseRef = useRef(false);
  const userStartedRef = useRef(false);
  const audioEnabledRef = useRef(true);
  const heardAudioRef = useRef(false);
  const completedRef = useRef(false);
  const resumeTimeRef = useRef(0);
  const [mobile, setMobile] = useState<boolean | null>(null);
  const [allowAutoplay, setAllowAutoplay] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const media = mobile === null ? null : mediaFor(mobile);

  useEffect(() => {
    const format = window.matchMedia('(max-width: 767px) and (orientation: portrait)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const sync = () => {
      setMobile(format.matches);
      setAllowAutoplay(!motion.matches && !connection?.saveData);
    };
    sync();
    format.addEventListener('change', sync);
    motion.addEventListener('change', sync);
    return () => {
      format.removeEventListener('change', sync);
      motion.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;
    let cancelled = false;
    const canPlay = () => !cancelled && visibleRef.current && !document.hidden &&
      !manualPauseRef.current && !completedRef.current && !video.ended && (allowAutoplay || userStartedRef.current);

    const start = async () => {
      if (!canPlay()) return;
      video.muted = !audioEnabledRef.current;
      try {
        await video.play();
        if (!canPlay()) video.pause();
        else if (!video.muted) heardAudioRef.current = true;
      } catch {
        if (!canPlay()) return;
        // A fresh visit often requires a gesture for audio. Keep the film moving.
        audioEnabledRef.current = false;
        video.muted = true;
        setMuted(true);
        try {
          await video.play();
          if (!canPlay()) video.pause();
        } catch {
          // Low-power mode and stricter browsers can require a manual play too.
          if (!cancelled) setPlaying(false);
        }
      }
    };
    const syncVisibility = () => {
      if (canPlay()) void start();
      else video.pause();
    };
    const restoreTime = () => {
      if (completedRef.current) video.currentTime = Math.max(0, video.duration - 0.01);
      else if (resumeTimeRef.current > 0 && resumeTimeRef.current < video.duration) {
        video.currentTime = resumeTimeRef.current;
      }
    };
    video.addEventListener('loadedmetadata', restoreTime);
    document.addEventListener('visibilitychange', syncVisibility);
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting && entry.intersectionRatio >= 0.55;
      onVisibilityChange(visibleRef.current);
      syncVisibility();
    }, { threshold: [0, 0.55, 1] });
    observer.observe(section);
    return () => {
      cancelled = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
      video.removeEventListener('loadedmetadata', restoreTime);
      video.pause();
    };
  }, [mobile, allowAutoplay, onVisibilityChange]);

  const playManually = async () => {
    const video = videoRef.current;
    if (!video) return;
    manualPauseRef.current = false;
    userStartedRef.current = true;
    if (failed) {
      video.load();
      setFailed(false);
    }
    if (video.ended || completedRef.current) video.currentTime = 0;
    completedRef.current = false;
    setEnded(false);
    try {
      await video.play();
      if (!visibleRef.current || document.hidden) video.pause();
    } catch {
      setPlaying(false);
    }
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      manualPauseRef.current = true;
      video.pause();
    } else void playManually();
  };

  const toggleSound = async () => {
    const video = videoRef.current;
    if (!video) return;
    const enable = video.muted;
    audioEnabledRef.current = enable;
    video.muted = !enable;
    setMuted(!enable);
    if (enable) {
      // Let visitors hear the opening line when they first enable the soundtrack.
      if (!heardAudioRef.current) video.currentTime = 0;
      await playManually();
      heardAudioRef.current = !video.paused;
    }
  };

  return (
    <section ref={sectionRef} id="opening-film" className="opening-film" aria-label="Meet IZEM: introduction film">
      <div className="opening-film__stage">
        <picture className={`opening-film__poster${hasFrame && !failed ? ' opening-film__poster--hidden' : ''}`}>
          <source media="(max-width: 767px) and (orientation: portrait)" srcSet={mediaFor(true).poster} />
          <img src={mediaFor(false).poster} alt="Meet IZEM, your AI fitness coach" width="1600" height="900" fetchPriority="high" />
        </picture>
        {media && (
          <video
            key={media.video}
            ref={videoRef}
            data-izem-opening-video="true"
            className={`opening-film__video${hasFrame && !failed ? ' opening-film__video--ready' : ''}`}
            src={media.video}
            poster={media.poster}
            muted={muted}
            playsInline
            preload={allowAutoplay ? 'auto' : 'none'}
            aria-label="IZEM introduction film"
            onPlaying={() => { setPlaying(true); setHasFrame(true); setFailed(false); }}
            onLoadedData={() => setHasFrame(true)}
            onSeeked={() => setHasFrame(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(event) => { resumeTimeRef.current = event.currentTarget.currentTime; }}
            onLoadStart={() => { setHasFrame(false); setEnded(completedRef.current); setFailed(false); }}
            onEnded={() => { completedRef.current = true; setEnded(true); setPlaying(false); }}
            onError={() => { setFailed(true); setPlaying(false); }}
          />
        )}
      </div>
      <div className="opening-film__bar">
        <div className="opening-film__controls" role="group" aria-label="Film controls">
          <button type="button" className="opening-film__sound" onClick={() => void toggleSound()} aria-label={muted ? 'Turn sound on' : 'Turn sound off'} aria-pressed={!muted} disabled={!media}>
            {muted ? <VolumeX size={17} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
            <span>{muted ? 'Sound on' : 'Sound off'}</span>
          </button>
          <button type="button" className="opening-film__play" onClick={togglePlayback} aria-label={ended ? 'Replay film' : playing ? 'Pause film' : 'Play film'} disabled={!media}>
            {ended ? <RotateCcw size={17} aria-hidden="true" /> : playing ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          </button>
        </div>
        <span className="opening-film__caption" aria-hidden="true">MEET YOUR COACH</span>
        <a className="opening-film__explore" href="#hero">Scroll to explore <ArrowDown size={17} aria-hidden="true" /></a>
      </div>
      {failed && <p className="opening-film__notice" role="status">The film couldn’t load. Explore IZEM below or press play to retry.</p>}
    </section>
  );
}
