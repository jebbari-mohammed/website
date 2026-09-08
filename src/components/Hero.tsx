import { useState } from 'react';
import { motion } from '../lib/motion';
import { ArrowRight, Play, CheckCircle2, Shield, MessageSquare, Dumbbell, Sparkles } from 'lucide-react';

export default function Hero() {
  const [activeVideo, setActiveVideo] = useState<'chat' | 'workout'>('chat');

  return (
    <section id="hero" className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
      {/* Subtle ambient back-glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[450px] bg-primary/[0.06] blur-[170px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[350px] bg-secondary/[0.04] blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Honest Product Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] text-xs font-semibold text-textSecondary mb-6 backdrop-blur-xl"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-textPrimary font-medium">AI Personal Trainer</span>
              <span className="text-white/20">•</span>
              <span className="text-primary font-medium">Adaptive & Proactive</span>
              <span className="text-white/20 hidden sm:inline">•</span>
              <span className="text-textSecondary/90 font-medium hidden sm:inline">Built for iOS & Android</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-[70px] font-extrabold tracking-tight text-textPrimary leading-[1.06] mb-6"
            >
              The AI Personal Trainer{' '}
              <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#C8FF7E] to-secondary">
                That Actually Coaches You.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg lg:text-xl text-textSecondary max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed mb-8"
            >
              Workouts calibrated to your gym equipment, nutrition that banks calories for dining out, and an intelligent coach that actually calls your phone before you skip.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8"
            >
              <a
                href="/izem-ai-fitness-coach/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-bold bg-primary text-[#070A0D] hover:bg-[#A3FF85] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-[0_0_30px_rgba(141,255,106,0.35)]"
              >
                <span>Experience IZEM</span>
                <ArrowRight size={18} />
              </a>

              <a
                href="#showcase"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full text-base font-medium text-textPrimary bg-white/[0.04] border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-white/[0.08] hover:border-white/[0.18] transition-all duration-200"
              >
                <Play size={16} className="text-primary fill-primary" />
                <span>Watch App Showcase</span>
              </a>
            </motion.div>

            {/* Trust & Highlights Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs sm:text-[13px] text-textSecondary font-medium"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-primary" />
                <span>100% Adaptive Plans</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-primary" />
                <span>Dynamic Macro Banking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-primary" />
                <span>Proactive Phone Calls</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={15} className="text-secondary" />
                <span>$24.99/mo • Cancel anytime</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 60 FPS iPhone Video Showcase with Interactive Switcher */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Sleek Segmented Switcher for Hero Videos */}
            <div className="mb-4 inline-flex p-1 rounded-full bg-[#0E141B]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.5)]">
              <button
                onClick={() => setActiveVideo('chat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeVideo === 'chat'
                    ? 'bg-primary text-[#070A0D] shadow-[0_0_15px_rgba(141,255,106,0.35)] font-bold'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-white/[0.05]'
                }`}
              >
                <MessageSquare size={14} />
                <span>AI Coach Chat</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 hidden sm:inline-block" />
              </button>

              <button
                onClick={() => setActiveVideo('workout')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeVideo === 'workout'
                    ? 'bg-primary text-[#070A0D] shadow-[0_0_15px_rgba(141,255,106,0.35)] font-bold'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-white/[0.05]'
                }`}
              >
                <Dumbbell size={14} />
                <span>Workouts & Meals</span>
              </button>
            </div>

            {/* Video Frame: Clean borderless container letting the native phone frame float */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative w-full max-w-[320px] sm:max-w-[350px]"
            >
              {/* Backlight glow */}
              <div className="absolute inset-4 bg-gradient-to-tr from-primary/25 via-transparent to-secondary/25 blur-3xl opacity-60 rounded-[50px] -z-10" />

              {/* Clean rounded container without extra outer border */}
              <div className="relative rounded-[36px] overflow-hidden aspect-[800/1260] shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_35px_rgba(141,255,106,0.12)]">
                <video
                  key={activeVideo}
                  src={activeVideo === 'chat' ? '/videos/izem-coach-chat-dark-web.mp4' : '/videos/izem-workout-nutrition-dark-web.mp4'}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover"
                >
                  Your browser does not support HTML5 video.
                </video>
              </div>

              {/* Dynamic Floating Telemetry Chips */}
              {activeVideo === 'chat' ? (
                <>
                  {/* Floating Chip 1: Biometrics */}
                  <div className="absolute -top-3 -right-4 sm:-right-6 bg-[#0E151B]/95 backdrop-blur-xl border border-white/[0.14] rounded-2xl px-3.5 py-2 shadow-2xl flex items-center gap-2 hidden sm:flex">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[11px] font-semibold text-textPrimary">❤️ Apple Health Informed</span>
                  </div>

                  {/* Floating Chip 2: Voice Call Scheduled */}
                  <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-[#0E151B]/95 backdrop-blur-xl border border-white/[0.14] rounded-2xl p-3 shadow-2xl flex items-center gap-3 hidden sm:flex">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      📞
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Proactive Voice Call</p>
                      <p className="text-xs text-textSecondary">Scheduled 5:45 PM before gym</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Floating Chip 1: Video Guidance */}
                  <div className="absolute -top-3 -right-4 sm:-right-6 bg-[#0E151B]/95 backdrop-blur-xl border border-white/[0.14] rounded-2xl px-3.5 py-2 shadow-2xl flex items-center gap-2 hidden sm:flex">
                    <Sparkles size={13} className="text-primary" />
                    <span className="text-[11px] font-semibold text-textPrimary">⚡ 60 FPS Form Guides</span>
                  </div>

                  {/* Floating Chip 2: Macro Banking */}
                  <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-[#0E151B]/95 backdrop-blur-xl border border-white/[0.14] rounded-2xl p-3 shadow-2xl flex items-center gap-3 hidden sm:flex">
                    <div className="w-8 h-8 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">
                      🥗
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">Dynamic Macro Bank</p>
                      <p className="text-xs text-textSecondary">2,970 kcal • 148g protein</p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
