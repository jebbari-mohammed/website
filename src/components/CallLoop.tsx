import { motion } from '../lib/motion';
import { Phone, Brain, BarChart3, ArrowRight } from 'lucide-react';

const moments = [
  {
    icon: Phone,
    title: 'Before the workout',
    text: 'A phone call is harder to ignore than another notification. It creates a real decision point when you are most likely to skip.',
  },
  {
    icon: Brain,
    title: 'After the workout',
    text: 'A day review turns vague memory into concrete feedback, so the coach can see what happened while the day is still fresh.',
  },
  {
    icon: BarChart3,
    title: 'Next week',
    text: 'The plan adapts from what actually happened, not what you meant to do. That is how workouts and meals stay realistic.',
  },
];

export default function CallLoop() {
  return (
    <section className="py-16 sm:py-[120px] px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute -top-32 left-1/2 h-[320px] w-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[11px] sm:text-[12px] text-primary font-bold uppercase tracking-[2px] mb-6 backdrop-blur-md">
            ✦ The Call Loop
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold font-condensed leading-[1.05] tracking-tighter mb-4">
            CALL. REVIEW.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ADAPT.</span>
          </h2>
          <p className="text-base sm:text-lg text-textSecondary max-w-[680px] mx-auto leading-relaxed font-light px-2">
            Most people do not need more reminders. They need the right nudge before the skip, a quick review after the day ends, and a plan that changes with reality.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {moments.map((moment, idx) => {
            const Icon = moment.icon;
            return (
              <motion.div
                key={moment.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="glass-card rounded-[24px] p-6 sm:p-8 border border-white/10 hover:border-primary/25 transition-colors"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-5 shadow-lg shadow-primary/15">
                  <Icon className="text-white" size={22} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-condensed tracking-tight mb-3 text-textPrimary">{moment.title}</h3>
                <p className="text-sm sm:text-[15px] text-textSecondary leading-relaxed font-light">{moment.text}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 sm:mt-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-[#0C1232]/70 px-6 py-5"
        >
          <div>
            <p className="text-sm sm:text-base text-textSecondary">
              <strong className="text-textPrimary">Use the loop when motivation drops.</strong> It is the simplest way to make accountability feel less like a tracker and more like a coach.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/fitness-app-that-calls-you/" className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15 transition-colors">
              Read the guide
              <ArrowRight size={16} />
            </a>
            <a href="/features/ai-voice-calls" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-textPrimary hover:border-primary/30 hover:bg-white/10 transition-colors">
              How voice calls work
            </a>
            <a href="/workout-consistency-calculator/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-textPrimary hover:border-primary/30 hover:bg-white/10 transition-colors">
              Consistency calculator
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
