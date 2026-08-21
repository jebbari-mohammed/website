import { motion } from '../lib/motion';
import { ArrowRight, Check, ShieldCheck, Sparkles, Zap } from 'lucide-react';

const coachLoopChecks = [
  {
    label: 'Initiation',
    question: 'Does the coach help before the workout gets skipped?',
    answer: 'IZEM can use optional scheduled calls and check-ins to create a clear decision point before training.',
    why: 'A plan has little value if the app waits until after the user has already drifted.',
  },
  {
    label: 'Weekly plan',
    question: 'Does it connect workouts and meals into one realistic week?',
    answer: 'IZEM builds weekly workout and meal plans around goals, schedule, equipment, preferences, and practical constraints.',
    why: 'Separate lists create more decisions. A connected week makes the next action easier to see.',
  },
  {
    label: 'Adaptation',
    question: 'What happens when the original plan no longer fits?',
    answer: 'IZEM can offer exercise substitutions, smaller fallback sessions, and later weekly plan adjustments.',
    why: 'The useful test is not whether a plan looks perfect on Sunday, but whether it survives Wednesday.',
  },
  {
    label: 'Context',
    question: 'Can the coach use relevant information instead of asking the same questions again?',
    answer: 'Workout history, meal context, preferences, check-ins, and optional food, body-progress, and equipment scans can inform coaching.',
    why: 'Context should reduce repetition and make the next recommendation less generic.',
  },
  {
    label: 'Review',
    question: 'Does the system close the loop after the day?',
    answer: 'Day reviews can capture what happened, why the plan changed, and what should carry into the next week.',
    why: 'A missed session becomes useful only when it changes the next decision.',
  },
  {
    label: 'Boundaries',
    question: 'Is the product honest about what it cannot replace?',
    answer: 'IZEM provides general fitness and nutrition guidance. It does not diagnose injuries, provide medical care, or replace hands-on form coaching.',
    why: 'A trustworthy coaching product should make escalation boundaries obvious before they are needed.',
  },
];

const boundaries = [
  'No medical diagnosis or injury rehabilitation claims',
  'No promise that a scan is a clinical body-composition measurement',
  'No claim that AI replaces hands-on technique coaching',
  'Call timing and accountability settings remain user-controlled',
];

export default function Comparison() {
  return (
    <section className="py-20 sm:py-[140px] px-4 sm:px-6 relative overflow-hidden bg-[#070A0D]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] bg-gradient-to-r from-primary/15 via-[#86D7FF]/10 to-transparent blur-[170px] rounded-full pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2.5 bg-[#111A22] border border-primary/40 rounded-full px-5 py-2 text-xs text-primary font-bold uppercase tracking-[2px] mb-6 backdrop-blur-xl shadow-[0_0_25px_rgba(141,255,106,0.2)]">
            <Zap size={14} className="fill-primary" />
            The Coach Loop Test
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black font-display leading-[1.02] tracking-tight mb-6">
            COMPARE THE COACHING LOOP.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#D8FF86] to-[#86D7FF]">
              NOT A STALE FEATURE TABLE.
            </span>
          </h2>
          <p className="text-base sm:text-xl text-textSecondary max-w-[760px] mx-auto leading-relaxed font-sans font-normal px-2">
            Prices and competitor features change. A more useful comparison is to test the decisions a coaching system can actually support. Below is IZEM&apos;s current first-party product scope—not a claim about what another app does or does not offer.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {coachLoopChecks.map((item, index) => (
            <motion.article
              key={item.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="glass-card rounded-[24px] p-6 sm:p-7 border border-white/10 bg-[#0E151B]/92 backdrop-blur-xl shadow-glass"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-primary/15 border border-primary/40 shadow-[0_0_18px_rgba(141,255,106,0.2)]">
                  <Check size={19} className="text-primary stroke-[3]" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[2px] font-black text-primary mb-2">{item.label}</p>
                  <h3 className="text-xl sm:text-2xl font-black text-textPrimary font-display leading-tight mb-3">
                    {item.question}
                  </h3>
                  <p className="text-sm sm:text-base text-textPrimary/90 leading-relaxed mb-3">
                    <strong className="text-primary">IZEM&apos;s answer:</strong> {item.answer}
                  </p>
                  <p className="text-sm text-textSecondary leading-relaxed">{item.why}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-6 sm:mt-8 rounded-[28px] border border-[#86D7FF]/20 bg-gradient-to-br from-[#101922] to-[#10162A] p-6 sm:p-8"
        >
          <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-7 lg:gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[#86D7FF] text-xs font-black uppercase tracking-[2px] mb-4">
                <ShieldCheck size={16} />
                Trust before persuasion
              </div>
              <h3 className="text-3xl sm:text-4xl font-black font-display text-textPrimary leading-tight mb-4">
                Verify current products at the source.
              </h3>
              <p className="text-textSecondary leading-relaxed mb-4">
                We removed named competitor prices and unsupported yes/no claims from this homepage because those details can change. When comparing any fitness app, confirm current pricing, platforms, safety boundaries, and feature availability on its official product or store listing.
              </p>
              <p className="text-sm text-textSecondary/80 leading-relaxed">
                IZEM&apos;s own scope is explained on the canonical product page and is reviewed under the public editorial policy.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-primary" />
                <p className="text-sm font-black text-textPrimary uppercase tracking-wider">IZEM safety boundaries</p>
              </div>
              <ul className="space-y-3 mb-6">
                {boundaries.map((boundary) => (
                  <li key={boundary} className="flex items-start gap-3 text-sm text-textSecondary leading-relaxed">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>{boundary}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
                <a
                  href="/izem-ai-fitness-coach/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-[#070A0D] font-black px-5 py-3 hover:opacity-90 transition-opacity"
                >
                  See how IZEM works <ArrowRight size={17} />
                </a>
                <a
                  href="/editorial-policy.html"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 text-textPrimary font-bold px-5 py-3 hover:bg-white/10 transition-colors"
                >
                  Editorial policy
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
