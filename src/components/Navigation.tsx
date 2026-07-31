import { useState } from 'react';
import { motion } from '../lib/motion';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex items-center justify-between bg-[#070A0D]/90 backdrop-blur-xl border-b border-white/10 shadow-glass"
        >
            <a href="/" className="flex items-center gap-2.5 group">
                <img
                    data-izem-navigation-logo="true"
                    src="/images/izem-app-logo-192.png"
                    alt=""
                    width="36"
                    height="36"
                    className="w-9 h-9 rounded-xl object-cover shadow-[0_0_15px_rgba(45,224,205,0.35)] transition-transform duration-300 group-hover:scale-105"
                />
                <span className="text-xl font-extrabold font-display tracking-wider text-textPrimary">IZEM</span>
            </a>

            <div className="hidden md:flex items-center gap-4 lg:gap-7">
                <a href="/izem-ai-fitness-coach/" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200">AI Coach</a>
                <a href="/fitness-app-that-calls-you/" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200">Voice Calls</a>
                <a href="/tools/" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200">Tools</a>
                <a href="/blog/" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200">Blog</a>
                <a href="#features" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200">Features</a>
                <a href="#how" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200">How it Works</a>
                <a href="#data" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200">Privacy</a>
            </div>

            <a href="/izem-ai-fitness-coach/" className="hidden md:flex bg-gradient-to-r from-primary to-secondary text-[#070A0D] px-5 py-2.5 rounded-full text-sm font-extrabold shadow-[0_0_20px_rgba(141,255,106,0.25)] hover:shadow-[0_0_30px_rgba(141,255,106,0.45)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-300">
                See Full Coach
            </a>

            <button className="md:hidden p-1" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X size={24} className="text-textSecondary" /> : <Menu size={24} className="text-textSecondary" />}
            </button>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 bg-[#0E151B] border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl"
                >
                    <a href="/izem-ai-fitness-coach/" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">IZEM AI Fitness Coach</a>
                    <a href="/fitness-app-that-calls-you/" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">Voice Calls Guide</a>
                    <a href="/tools/" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">Free Calculators</a>
                    <a href="/blog/" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">Blog</a>
                    <a href="#features" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">Features</a>
                    <a href="#how" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">How it Works</a>
                    <a href="#data" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">Privacy</a>
                    <a href="#delete" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">Data Deletion</a>
                    <a href="/izem-ai-fitness-coach/" onClick={() => setIsOpen(false)} className="mt-2 text-center bg-gradient-to-r from-primary to-secondary text-[#070A0D] px-5 py-3 rounded-full text-sm font-extrabold shadow-lg">
                        See Full Coach
                    </a>
                </motion.div>
            )}
        </motion.nav>
    );
}
