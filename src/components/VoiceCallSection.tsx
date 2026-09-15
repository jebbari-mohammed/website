import { useState } from 'react';
import { motion } from '../lib/motion';
import { ArrowRight, CheckCircle2, MessageSquare, Phone, PhoneCall, Shield, Sliders, Sparkles } from 'lucide-react';

interface CallScenario {
  id: 'preworkout' | 'userinitiated' | 'review';
  title: string;
  subtitle: string;
  badge: string;
  dialogue: {
    speaker: 'coach' | 'user';
    text: string;
  }[];
  demonstrates: string;
}

const scenarios: CallScenario[] = [
  {
    id: 'preworkout',
    title: 'Pre-Workout Call',
    subtitle: 'Illustrative example of an optional coach-initiated call around a planned training session.',
    badge: 'OPTIONAL PROACTIVE CALL',
    dialogue: [
      {
        speaker: 'coach',
        text: 'Your upper-body session is coming up. You logged the last one, so I can use that context instead of giving you a generic reminder. Are you still training today?',
      },
      {
        speaker: 'user',
        text: 'Yes, but I only have about half the time I planned.',
      },
      {
        speaker: 'coach',
        text: 'Then I can help you choose a shorter version. I’ll keep the important work and show you the proposed change before anything larger is saved.',
      },
    ],
    demonstrates: 'The call can use relevant workout context and respond to a real schedule change without pretending a plan change happened before confirmation.',
  },
  {
    id: 'userinitiated',
    title: 'You Call the Coach',
    subtitle: 'Illustrative example of a premium member starting a live coach call from the app.',
    badge: 'USER-INITIATED CALL',
    dialogue: [
      {
        speaker: 'user',
        text: 'I’m at the gym and the exercise in my plan is not available. What should I do?',
      },
      {
        speaker: 'coach',
        text: 'I can use today’s workout and your available-equipment context to help find a supported substitute that keeps the same training goal.',
      },
      {
        speaker: 'user',
        text: 'Give me the replacement.',
      },
      {
        speaker: 'coach',
        text: 'I’ll propose the supported swap and confirm what changed so your workout log stays consistent with the plan you are actually doing.',
      },
    ],
    demonstrates: 'Premium members can initiate the conversation instead of waiting for a scheduled reminder.',
  },
  {
    id: 'review',
    title: 'Day Review Call',
    subtitle: 'Illustrative example of a review that uses recorded evidence rather than inventing how the day went.',
    badge: 'REVIEW MOMENT',
    dialogue: [
      {
        speaker: 'coach',
        text: 'I can see the workout was logged as partial and that two meals were recorded. I won’t treat the missing data as a completed day.',
      },
      {
        speaker: 'user',
        text: 'I had to leave the gym early. I’ll finish the week normally.',
      },
      {
        speaker: 'coach',
        text: 'Got it. We can use what you actually completed when reviewing the week, rather than making up volume you did not perform.',
      },
    ],
    demonstrates: 'The coaching loop can distinguish full, partial, missed and uncertain workout states when the underlying evidence supports it.',
  },
];

export default function VoiceCallSection() {
  const [activeScenario, setActiveScenario] = useState<CallScenario['id']>('preworkout');
  const current = scenarios.find((scenario) => scenario.id === activeScenario) || scenarios[0];

  return (
    <section id="how-calls-work" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#05080C] border-t border-white/[0.06] scroll-mt-20">
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-primary/[0.05] blur-[170px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] text-xs font-semibold text-primary mb-4">
            <PhoneCall size={13} className="text-primary" />
            <span>LIVE COACH CONVERSATIONS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-4">
            You Can Call the Coach. The Coach Can Call You.
          </h2>
          <p className="text-base sm:text-lg text-textSecondary font-normal leading-relaxed">
            Premium members can start a live coach call. Optional proactive calls can also support planned-workout accountability and review moments when the account, platform, allowance, and call settings permit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 sm:mb-16">
          <div className="p-6 rounded-2xl specular-card flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono font-bold text-sm mb-4">01</div>
              <h3 className="text-base font-bold text-textPrimary mb-2">You Control Call Settings</h3>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                Workout timing and reminder-call preferences stay under user control. The current app supports reminder offsets including 5, 15, 30, or 60 minutes before a planned workout.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-textSecondary/70 flex items-center gap-1.5">
              <Sliders size={12} className="text-primary" /> Optional scheduling
            </div>
          </div>

          <div className="p-6 rounded-2xl specular-card flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono font-bold text-sm mb-4">02</div>
              <h3 className="text-base font-bold text-textPrimary mb-2">The Conversation Has Context</h3>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                Supported calls can use relevant current-plan, meal, progress and saved coaching context. On supported iPhones, minimized Apple Health context is separate and consent-based.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-textSecondary/70 flex items-center gap-1.5">
              <MessageSquare size={12} className="text-primary" /> Context, not a blank call
            </div>
          </div>

          <div className="p-6 rounded-2xl specular-card flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono font-bold text-sm mb-4">03</div>
              <h3 className="text-base font-bold text-textPrimary mb-2">Changes Stay Under Your Control</h3>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                The coach can help with supported exercise, workout-day and meal changes. Larger or destructive changes should be previewed and confirmed before they are committed.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-textSecondary/70 flex items-center gap-1.5">
              <Shield size={12} className="text-primary" /> Confirmation before major changes
            </div>
          </div>
        </div>

        <div className="specular-card rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-8 border-b border-white/[0.08] mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-2">
                <Sparkles size={12} />
                <span>Illustrative examples — not testimonials</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-textPrimary">
                What a context-aware call can look like
              </h3>
            </div>

            <div className="inline-flex p-1 rounded-full bg-[#0B1017] border border-white/[0.1] shadow-inner max-w-full overflow-x-auto">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setActiveScenario(scenario.id)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    activeScenario === scenario.id
                      ? 'bg-primary text-[#070A0D] shadow-[0_0_15px_rgba(141,255,106,0.3)] font-bold'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-white/[0.04]'
                  }`}
                >
                  {scenario.title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[320px] rounded-3xl p-6 bg-gradient-to-b from-[#0E151D] to-[#080D14] border border-white/[0.12] shadow-2xl relative">
                <div className="flex justify-between items-center text-[10px] text-textSecondary font-mono mb-4 pb-2 border-b border-white/[0.06]">
                  <span>Live voice example</span>
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Two-way audio
                  </span>
                </div>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/40 mx-auto flex items-center justify-center text-primary text-2xl shadow-[0_0_25px_rgba(141,255,106,0.2)] mb-3">
                    <Phone size={26} />
                  </div>
                  <h4 className="text-base font-bold text-textPrimary">IZEM AI Coach</h4>
                  <p className="text-xs text-primary font-medium mt-0.5">{current.badge}</p>
                </div>

                <div className="flex items-center justify-center gap-1 h-10 mb-6 bg-white/[0.03] p-2 rounded-xl border border-white/[0.05]" aria-hidden="true">
                  {[3, 6, 8, 5, 7, 4, 6].map((height, index) => (
                    <span key={index} className="w-1 bg-primary rounded-full" style={{ height: `${height * 4}px` }} />
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 pt-2">
                  <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-textSecondary text-xs">Mic</div>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-300 text-xs font-bold">End</div>
                  <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-textSecondary text-xs">Audio</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs font-semibold text-textSecondary">
                {current.subtitle}
              </div>

              <div className="space-y-3">
                {current.dialogue.map((item, index) => (
                  <motion.div
                    key={`${current.id}-${index}`}
                    initial={{ opacity: 0, x: item.speaker === 'coach' ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      item.speaker === 'coach'
                        ? 'bg-[#0E151E] border border-primary/20 text-textPrimary'
                        : 'bg-white/[0.04] border border-white/[0.08] text-textSecondary ml-6 sm:ml-12'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${item.speaker === 'coach' ? 'text-primary' : 'text-textSecondary/70'}`}>
                        {item.speaker === 'coach' ? 'Coach' : 'You'}
                      </span>
                    </div>
                    <p>{item.text}</p>
                  </motion.div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 flex items-start gap-2.5 text-xs text-textPrimary">
                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-primary">What this example demonstrates: </span>
                  <span>{current.demonstrates}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-textSecondary">
              <Shield size={14} className="text-primary" />
              <span>Illustrative dialogue only. Exact call wording, availability and allowances vary with context and current account terms.</span>
            </div>
            <a href="/features/ai-voice-calls" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-[#A3FF85] transition-colors group whitespace-nowrap">
              <span>Voice-call details</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
