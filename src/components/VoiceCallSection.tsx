import { useState } from 'react';
import { motion } from '../lib/motion';
import { Phone, PhoneCall, CheckCircle2, Sliders, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';

interface CallScenario {
  id: 'preworkout' | 'busy' | 'review';
  title: string;
  subtitle: string;
  badge: string;
  callerHeader: string;
  dialogue: {
    speaker: 'coach' | 'user';
    text: string;
  }[];
  outcome: string;
}

const scenarios: CallScenario[] = [
  {
    id: 'preworkout',
    title: 'Pre-Workout Decision Window',
    subtitle: 'Rings 15 minutes before your planned session to break procrastination.',
    badge: '15 Mins Before Gym',
    callerHeader: 'Incoming Audio Call • Pre-Workout Readiness',
    dialogue: [
      {
        speaker: 'coach',
        text: 'Hey! Your Chest & Shoulders session starts in 15 minutes. Apple Health shows your recovery is solid today. Ready to head out?',
      },
      {
        speaker: 'user',
        text: 'Yeah, almost talked myself out of it, but I’m putting my shoes on now.',
      },
      {
        speaker: 'coach',
        text: 'Great. We have 4 working sets on Incline Dumbbell Press. Aim for 65 lbs on set one. See you in the log.',
      },
    ],
    outcome: 'Decision friction eliminated. Workout started on time without skipping.',
  },
  {
    id: 'busy',
    title: 'Busy Day Fallback Rescue',
    subtitle: 'Work running late? Your coach pivots to a 20-minute fallback so your streak stays alive.',
    badge: 'Decision-Fatigue Rescue',
    callerHeader: 'Incoming Audio Call • Schedule Adjustment',
    dialogue: [
      {
        speaker: 'coach',
        text: 'Hey, checking in for your 6:00 PM session. Are we still good for the full 50-minute lift?',
      },
      {
        speaker: 'user',
        text: 'My meeting ran long and I’m exhausted. Don’t think I can do 50 minutes.',
      },
      {
        speaker: 'coach',
        text: 'Totally get it. Let’s not scrap the day. I’ve swapped your plan to a 20-minute dumbbell superset routine. Three movements, zero waiting for machines. Deal?',
      },
      {
        speaker: 'user',
        text: 'Deal. I can do 20 minutes.',
      },
    ],
    outcome: 'Habit momentum protected without shame or an all-or-nothing guilt cycle.',
  },
  {
    id: 'review',
    title: 'Evening Day Review Check-in',
    subtitle: 'Closes the daily loop on sets, logged nutrition, and tomorrow’s training adaptation.',
    badge: 'Evening Check-in',
    callerHeader: 'Incoming Audio Call • Day Review & Macro Sync',
    dialogue: [
      {
        speaker: 'coach',
        text: 'Quick evening review: You hit your 20-minute fallback session and logged 152g of protein. Great save today.',
      },
      {
        speaker: 'user',
        text: 'Thanks, felt good to get something in.',
      },
      {
        speaker: 'coach',
        text: 'Tomorrow is Leg Day. I’ve shifted the missed upper volume into Thursday’s recovery slots. Sleep well!',
      },
    ],
    outcome: 'Tomorrow’s plan is already adapted. Zero guesswork when waking up.',
  },
];

export default function VoiceCallSection() {
  const [activeScenario, setActiveScenario] = useState<CallScenario['id']>('preworkout');
  const current = scenarios.find((s) => s.id === activeScenario) || scenarios[0];

  return (
    <section id="how-calls-work" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#05080C] border-t border-white/[0.06] scroll-mt-20">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-primary/[0.05] blur-[170px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] text-xs font-semibold text-primary mb-4">
            <PhoneCall size={13} className="text-primary" />
            <span>PROACTIVE ACCOUNTABILITY ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-4">
            How Our Coach Actually Calls You.
          </h2>
          <p className="text-base sm:text-lg text-textSecondary font-normal leading-relaxed">
            Push notifications get swiped away alongside 20 other alerts. An actual phone call creates a real decision point when you are about to talk yourself out of training.
          </p>
        </div>

        {/* 3 Step Process Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 sm:mb-16">
          <div className="p-6 rounded-2xl specular-card flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono font-bold text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-textPrimary mb-2">
                You Set Your Schedule
              </h3>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                Choose your workout days and target times. Set your call window (e.g. 10, 15, or 30 minutes before your planned workout).
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-textSecondary/70 flex items-center gap-1.5">
              <Sliders size={12} className="text-primary" /> 100% User Configurable
            </div>
          </div>

          <div className="p-6 rounded-2xl specular-card flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono font-bold text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-textPrimary mb-2">
                The Coach Rings Your Phone
              </h3>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                Your phone rings. You pick up, and your AI coach speaks with context on your target weights, recent recovery, and planned exercises.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-textSecondary/70 flex items-center gap-1.5">
              <Phone size={12} className="text-primary" /> Natural Two-Way Spoken Voice
            </div>
          </div>

          <div className="p-6 rounded-2xl specular-card flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono font-bold text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-textPrimary mb-2">
                Fallback Over Failure
              </h3>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                Tired or low on time? Don't skip. The coach instantly swaps your session into a 15–20 min fallback plan so you keep your momentum.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-textSecondary/70 flex items-center gap-1.5">
              <Zap size={12} className="text-primary" /> Zero False Guilt Loops
            </div>
          </div>
        </div>

        {/* Interactive Scenario Cockpit */}
        <div className="specular-card rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-8 border-b border-white/[0.08] mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-2">
                <Sparkles size={12} />
                <span>Interactive Call Scenarios</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-textPrimary">
                Listen to how the AI coach handles real-life friction
              </h3>
            </div>

            {/* Scenario Switcher Tabs */}
            <div className="inline-flex p-1 rounded-full bg-[#0B1017] border border-white/[0.1] shadow-inner max-w-full overflow-x-auto">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveScenario(s.id)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    activeScenario === s.id
                      ? 'bg-primary text-[#070A0D] shadow-[0_0_15px_rgba(141,255,106,0.3)] font-bold'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-white/[0.04]'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Dialogue Visualizer */}
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left: Phone UI Simulation */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[320px] rounded-3xl p-6 bg-gradient-to-b from-[#0E151D] to-[#080D14] border border-white/[0.12] shadow-2xl relative">
                {/* Status Bar */}
                <div className="flex justify-between items-center text-[10px] text-textSecondary font-mono mb-4 pb-2 border-b border-white/[0.06]">
                  <span>HD Voice Call</span>
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    Connected
                  </span>
                </div>

                {/* Caller Badge */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/40 mx-auto flex items-center justify-center text-primary text-2xl shadow-[0_0_25px_rgba(141,255,106,0.2)] mb-3 animate-pulse">
                    📞
                  </div>
                  <h4 className="text-base font-bold text-textPrimary">IZEM AI Personal Trainer</h4>
                  <p className="text-xs text-primary font-medium mt-0.5">{current.badge}</p>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="flex items-center justify-center gap-1 h-10 mb-6 bg-white/[0.03] p-2 rounded-xl border border-white/[0.05]">
                  <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                  <span className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.25s' }} />
                  <span className="w-1 h-8 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1 h-5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <span className="w-1 h-7 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                  <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.35s' }} />
                </div>

                {/* Control Icons */}
                <div className="flex items-center justify-center gap-6 pt-2">
                  <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-textSecondary text-xs">
                    🎙️
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-sm font-bold shadow-md">
                    End
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-textSecondary text-xs">
                    🔊
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Spoken Dialogue Transcript */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs font-semibold text-textSecondary">
                {current.subtitle}
              </div>

              <div className="space-y-3">
                {current.dialogue.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: item.speaker === 'coach' ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      item.speaker === 'coach'
                        ? 'bg-[#0E151E] border border-primary/20 text-textPrimary'
                        : 'bg-white/[0.04] border border-white/[0.08] text-textSecondary ml-6 sm:ml-12'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        item.speaker === 'coach' ? 'text-primary' : 'text-textSecondary/70'
                      }`}>
                        {item.speaker === 'coach' ? '✦ Coach Spoken Audio' : '👤 You'}
                      </span>
                    </div>
                    <p>{item.text}</p>
                  </motion.div>
                ))}
              </div>

              {/* Outcome Banner */}
              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 flex items-start gap-2.5 text-xs text-textPrimary">
                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-primary">Result: </span>
                  <span>{current.outcome}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Link to Full Guide */}
          <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-textSecondary">
              <Shield size={14} className="text-primary" />
              <span>Calls are completely optional and scheduled entirely under your control in app settings.</span>
            </div>
            <a
              href="/fitness-app-that-calls-you/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:text-[#A3FF85] transition-colors"
            >
              <span>Read the Full Phone Call Accountability Guide</span>
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
