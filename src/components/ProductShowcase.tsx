import { useEffect, useRef, useState } from 'react';
import { motion } from '../lib/motion';
import { Dumbbell, Utensils, MessageSquare, Phone, ArrowRight, CheckCircle, Flame, HeartPulse, Activity, ShoppingBasket, ShieldCheck, type LucideIcon } from 'lucide-react';

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
    badge: 'Real Training Data',
    videoSrc: '/videos/izem-workout-nutrition-dark-web.mp4',
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
    videoSrc: '/videos/izem-workout-nutrition-dark-web.mp4',
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
        icon: HeartPulse,
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
    videoSrc: '/videos/izem-coach-chat-dark-web.mp4',
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
        desc: 'On supported iPhones, a bounded Health summary can support relevant coaching only after separate permission and consent.',
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/[0.04] blur-[180px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full">
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
            See the Connected Coaching System.
          </h2>
          <p className="text-base sm:text-lg text-textSecondary font-normal leading-relaxed">
            Select a capability to see how training, nutrition and coach conversations fit together instead of living in separate apps.
          </p>
        </motion.div>

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

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[350px]">
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
