import { useEffect, useRef, useState } from 'react';
import { motion } from '../lib/motion';
import { Dumbbell, Utensils, MessageSquare, Phone, ArrowRight, CheckCircle, Flame, HeartPulse, Activity, type LucideIcon } from 'lucide-react';

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
    badge: 'Dynamic Hypertrophy',
    videoSrc: '/videos/izem-workout-nutrition-dark-web.mp4',
    headline: 'Workouts designed for your real gym, not an ideal world.',
    description: 'Every session is mathematically calibrated to your available equipment, fatigue levels, and recovery history with embedded 60 FPS video demonstrations.',
    features: [
      {
        icon: Dumbbell,
        title: '60 FPS Form Demonstrations',
        desc: 'Crystal-clear execution videos for every exercise with exact cueing on setup, joint angles, and bar path.',
      },
      {
        icon: Activity,
        title: 'Smart Exercise Substitutions',
        desc: 'Gym machine taken? Tap once to swap into biomechanically equivalent dumbbell, cable, or bodyweight alternatives.',
      },
      {
        icon: Flame,
        title: 'Double Progression Protocol',
        desc: 'Automatic rep and weight incrementation based on verified bar velocity and previous set RPE targets.',
      },
    ],
    ctaText: 'Explore Adaptive Workouts',
    ctaLink: '/features/ai-workout-generator',
  },
  {
    id: 'nutrition',
    title: 'Precision Nutrition',
    badge: 'Flexible Macro Banking',
    videoSrc: '/videos/izem-workout-nutrition-dark-web.mp4',
    headline: 'Hit your body recomposition goals without bland diets.',
    description: 'IZEM builds custom meal plans around your cuisine, budget, and daily training demands with built-in macro banking for social dinners.',
    features: [
      {
        icon: Utensils,
        title: 'Calorie & Macro Banking',
        desc: 'Have a client steakhouse dinner or weekend party? IZEM rebalances earlier meals to keep you in your macro deficit.',
      },
      {
        icon: CheckCircle,
        title: 'Cooking Video Guides',
        desc: 'Quick, high-protein recipe breakdowns tailored to your cooking experience and kitchen equipment.',
      },
      {
        icon: HeartPulse,
        title: 'Visual Camera Scans',
        desc: 'Scan your plate with your camera for rapid estimation of protein, carbs, fats, and total calories.',
      },
    ],
    ctaText: 'See the AI Meal Planner',
    ctaLink: '/features/ai-meal-planner',
  },
  {
    id: 'chat',
    title: 'Coach Intelligence & Calls',
    badge: '24/7 Context Memory',
    videoSrc: '/videos/izem-coach-chat-dark-web.mp4',
    headline: 'An AI coach that knows your biometrics and calls your phone.',
    description: 'Not a dumb chatbot. IZEM monitors Apple Health data, adjusts your workouts when lower back fatigue spikes, and schedules real voice calls.',
    features: [
      {
        icon: HeartPulse,
        title: 'Apple Health & Biometrics Sync',
        desc: 'Monitors resting heart rate and HRV. Automatically drops axial load when recovery drops below baseline.',
      },
      {
        icon: MessageSquare,
        title: 'Biomechanical Technique Cues',
        desc: 'Ask about hamstring activation or bench setup and get personalized anatomical focus points for next session.',
      },
      {
        icon: Phone,
        title: 'Proactive Voice Accountability',
        desc: 'Schedule a real voice call 15 minutes before gym time to review workout intensity targets and lock in focus.',
      },
    ],
    ctaText: 'How Voice Calls Work',
    ctaLink: '/fitness-app-that-calls-you/',
  },
];

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab['id']>('workout');
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const current = tabs.find((t) => t.id === activeTab) || tabs[0];

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

  return (
    <section id="showcase" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#070A0D]/60 border-t border-white/[0.06]">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/[0.04] blur-[180px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-primary mb-4">
            ✦ INTERACTIVE PRODUCT SHOWCASE
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-4">
            Experience the Coaching Engine.
          </h2>
          <p className="text-base sm:text-lg text-textSecondary font-normal leading-relaxed">
            See the actual 60 FPS interface in action. Select a capability to inspect how IZEM handles training, nutrition, and biometric coaching.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12 sm:mb-16">
          <div className="inline-flex p-1.5 rounded-full bg-[#0B1017]/90 backdrop-blur-2xl border border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_15px_35px_rgba(0,0,0,0.6)] max-w-full overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-[#070A0D] shadow-[0_0_20px_rgba(141,255,106,0.35)] font-bold'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-white/[0.04]'
                  }`}
                >
                  {tab.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Content Grid */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Video Preview on Left */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[350px]">
              {/* Backlight halo */}
              <div className="absolute inset-4 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/20 blur-3xl opacity-70 rounded-[50px] -z-10" />

              <div
                ref={videoFrameRef}
                className="relative rounded-[36px] overflow-hidden aspect-[800/1260] shadow-[0_30px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(141,255,106,0.15)] bg-[#0B1017]"
              >
                {shouldLoadVideo ? (
                  <video
                    key={current.videoSrc}
                    src={current.videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div aria-hidden="true" className="w-full h-full bg-gradient-to-br from-white/[0.03] to-primary/[0.04]" />
                )}
              </div>
            </div>
          </div>

          {/* Feature Breakdown on Right */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-4 shadow-sm">
              <span>●</span>
              <span>{current.badge}</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-textPrimary leading-snug mb-4">
              {current.headline}
            </h3>

            <p className="text-base text-textSecondary leading-relaxed mb-8">
              {current.description}
            </p>

            {/* Sub-feature points */}
            <div className="space-y-4 mb-8">
              {current.features.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl specular-card hover:border-primary/40 transition-all duration-300"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5 shadow-sm">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-textPrimary mb-1">
                          {item.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action CTA Link */}
            <div>
              <a
                href={current.ctaLink}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-[#A3FF85] transition-colors group"
              >
                <span>{current.ctaText}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
