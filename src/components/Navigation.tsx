import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Zap } from 'lucide-react';

export default function Navigation() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex items-center justify-between bg-bgPrimary/85 backdrop-blur-xl border-b border-white/10"
        >
            <a href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                    <Zap size={20} className="fill-white" />
                </div>
                <span className="text-lg font-bold font-condensed tracking-wide text-textPrimary">Your AI Coach</span>
            </a>

            <div className="hidden md:flex items-center gap-7">
                <a href="#features" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200">Features</a>
                <a href="#how" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200">How it Works</a>
                <a href="#data" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200">Privacy</a>
                <a href="#delete" className="text-sm font-medium text-textSecondary hover:text-primary transition-colors duration-200">Data Deletion</a>
            </div>

            <a href="#download" className="hidden md:flex bg-gradient-to-r from-primary to-secondary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-85 transition-opacity">
                Start for Free
            </a>

            <button className="md:hidden p-1" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X size={24} className="text-textSecondary" /> : <Menu size={24} className="text-textSecondary" />}
            </button>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 bg-bgPrimary border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl"
                >
                    <a href="#features" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">Features</a>
                    <a href="#how" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">How it Works</a>
                    <a href="#data" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">Privacy</a>
                    <a href="#delete" onClick={() => setIsOpen(false)} className="text-base font-medium text-textPrimary hover:text-primary">Data Deletion</a>
                    <a href="#download" onClick={() => setIsOpen(false)} className="mt-2 text-center bg-gradient-to-r from-primary to-secondary text-white px-5 py-3 rounded-full text-sm font-semibold">
                        Start for Free
                    </a>
                </motion.div>
            )}
        </motion.nav>
    );
}
