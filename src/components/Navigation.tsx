import { useState } from 'react';
import { motion } from '../lib/motion';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-[100] px-4 sm:px-8 py-3.5 bg-[#05080C]/85 backdrop-blur-2xl border-b border-white/[0.08]"
    >
      {/* Bottom subtle glowing accent rail */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2.5 group">
          <img
            data-izem-navigation-logo="true"
            src="/images/izem-app-logo-192.png"
            alt="IZEM logo"
            width="34"
            height="34"
            className="w-8 h-8 sm:w-[34px] sm:h-[34px] rounded-xl object-cover shadow-[0_0_12px_rgba(141,255,106,0.3)] transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-textPrimary">IZEM</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/80 hidden sm:inline-block">AI Coach</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <a href="/izem-ai-fitness-coach/" className="text-[13px] font-medium text-textSecondary hover:text-textPrimary transition-colors">
            AI Coach
          </a>
          <a href="#showcase" className="text-[13px] font-medium text-textSecondary hover:text-textPrimary transition-colors">
            Showcase
          </a>
          <a href="/features/ai-workout-generator" className="text-[13px] font-medium text-textSecondary hover:text-textPrimary transition-colors">
            Workouts
          </a>
          <a href="/features/ai-meal-planner" className="text-[13px] font-medium text-textSecondary hover:text-textPrimary transition-colors">
            Nutrition
          </a>
          <a href="/#how-calls-work" className="text-[13px] font-medium text-textSecondary hover:text-textPrimary transition-colors">
            Voice Calls
          </a>
          <a href="/tools/" className="text-[13px] font-medium text-textSecondary hover:text-textPrimary transition-colors">
            Calculators
          </a>
          <a href="/blog/" className="text-[13px] font-medium text-textSecondary hover:text-textPrimary transition-colors">
            Blog
          </a>
        </div>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/izem-ai-fitness-coach/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold bg-white text-[#070A0D] hover:bg-primary hover:text-[#070A0D] transition-all duration-300 shadow-sm"
          >
            <span>Get Started</span>
            <ArrowRight size={14} />
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-textSecondary hover:text-textPrimary"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mt-3 pt-4 pb-6 px-4 border-t border-white/[0.08] flex flex-col gap-3 bg-[#070A0D]/95 rounded-2xl"
        >
          <a href="/izem-ai-fitness-coach/" onClick={() => setIsOpen(false)} className="text-sm font-medium text-textPrimary py-1.5 flex items-center justify-between">
            <span>IZEM AI Fitness Coach</span>
            <Sparkles size={14} className="text-primary" />
          </a>
          <a href="#showcase" onClick={() => setIsOpen(false)} className="text-sm font-medium text-textSecondary py-1.5">
            App Showcase
          </a>
          <a href="/features/ai-workout-generator" onClick={() => setIsOpen(false)} className="text-sm font-medium text-textSecondary py-1.5">
            Adaptive Workouts
          </a>
          <a href="/features/ai-meal-planner" onClick={() => setIsOpen(false)} className="text-sm font-medium text-textSecondary py-1.5">
            Meal Planning & Macros
          </a>
          <a href="/#how-calls-work" onClick={() => setIsOpen(false)} className="text-sm font-medium text-textSecondary py-1.5">
            Voice Calling Guide
          </a>
          <a href="/tools/" onClick={() => setIsOpen(false)} className="text-sm font-medium text-textSecondary py-1.5">
            Free Calculators
          </a>
          <a href="/blog/" onClick={() => setIsOpen(false)} className="text-sm font-medium text-textSecondary py-1.5">
            Guides & Articles
          </a>
          <div className="pt-3 border-t border-white/[0.08]">
            <a
              href="/izem-ai-fitness-coach/"
              onClick={() => setIsOpen(false)}
              className="w-full text-center inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold bg-primary text-[#070A0D] shadow-lg shadow-primary/20"
            >
              <span>Explore AI Coach</span>
              <ArrowRight size={15} />
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
