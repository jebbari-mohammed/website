import { useState } from 'react';
import { motion } from '../lib/motion';
import { ArrowRight, CheckCircle2, MessageSquare, Dumbbell } from 'lucide-react';
import CoachingDiagram from './CoachingDiagram';

export default function Hero() {
  const [activeDiagram, setActiveDiagram] = useState<'chat' | 'workout'>('chat');

  return (
    <section id="hero" className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
      <div aria-hidden="true" className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-primary/[0.04] blur-[170px] rounded-full pointer-events-none -z-10" />
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid !grid-cols-1 lg:!grid-cols-12 gap-12 lg:gap-10 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/[0.07] border border-primary/20 text-xs font-semibold text-primary mb-6">
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-primary" />
              App awaiting store review
            </div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-4xl sm:text-6xl lg:text-[70px] font-extrabold tracking-tight leading-[1.06] mb-6">
              IZEM.{' '}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#C8FF7E] to-secondary">Your AI Personal Trainer</span>
            </motion.h1>
            <p className="text-base sm:text-lg lg:text-xl text-textSecondary max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-6">
              Workouts, meals and coaching that share the same context. IZEM connects weekly plans, training logs, progress, AI chat and eligible voice calls around one profile.
            </p>
            <p className="text-sm text-textSecondary max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8">
              The IZEM app is awaiting store review. While you wait, build a starting plan with the free workout generator on this website.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
              <a href="/workout-plan-generator/" className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-full text-sm sm:text-base font-bold bg-primary text-[#070A0D] hover:bg-[#A3FF85] transition-colors shadow-[0_0_30px_rgba(141,255,106,0.2)]">
                <span>Try the free workout generator</span><ArrowRight aria-hidden="true" size={18} />
              </a>
              <a href="#capabilities" className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-4 rounded-full text-sm font-medium border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors">Explore the app’s features</a>
            </div>
            <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-3 text-xs text-textSecondary">
              {['Workout plans & logs', 'Meals & grocery lists', 'Chat & eligible voice calls'].map((label) => <span key={label} className="flex items-center gap-1.5"><CheckCircle2 aria-hidden="true" size={15} className="text-primary shrink-0" />{label}</span>)}
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col items-center w-full">
            <div className="mb-5 inline-flex p-1 rounded-full bg-[#0E141B] border border-white/[0.12]" role="group" aria-label="Choose a feature diagram">
              <button onClick={() => setActiveDiagram('chat')} aria-pressed={activeDiagram === 'chat'} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-colors ${activeDiagram === 'chat' ? 'bg-primary text-[#070A0D]' : 'text-textSecondary hover:text-textPrimary'}`}><MessageSquare aria-hidden="true" size={14} />Coaching context</button>
              <button onClick={() => setActiveDiagram('workout')} aria-pressed={activeDiagram === 'workout'} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-colors ${activeDiagram === 'workout' ? 'bg-primary text-[#070A0D]' : 'text-textSecondary hover:text-textPrimary'}`}><Dumbbell aria-hidden="true" size={14} />Workout planning</button>
            </div>
            <div className="w-full max-w-[440px]"><CoachingDiagram mode={activeDiagram} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
