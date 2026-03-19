import { Zap } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-bgPrimary border-t border-white/10 pt-[60px] pb-8 px-6">
            <div className="max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
                    <div className="md:col-span-5">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                                <Zap size={18} className="fill-white" />
                            </div>
                            <span className="text-base font-bold font-condensed tracking-wide text-textPrimary">Your AI Coach</span>
                        </div>
                        <p className="text-sm text-textSecondary leading-[1.7] max-w-[280px]">
                            AI-powered fitness guidance tailored to your body. Not medical advice.
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="text-[13px] font-bold uppercase tracking-[1px] text-textSecondary/70 mb-4 font-sans">App</h4>
                        <div className="flex flex-col gap-2.5">
                            <a href="https://apps.apple.com/app/your-ai-coach" className="text-sm text-textSecondary hover:text-primary transition-colors">App Store</a>
                            <a href="https://play.google.com/store/apps/details?id=com.ai.gym.coach" className="text-sm text-textSecondary hover:text-primary transition-colors">Google Play</a>
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <h4 className="text-[13px] font-bold uppercase tracking-[1px] text-textSecondary/70 mb-4 font-sans">Legal</h4>
                        <div className="flex flex-col gap-2.5">
                            <a href="/privacy-policy.html" className="text-sm text-textSecondary hover:text-primary transition-colors">Privacy Policy</a>
                            <a href="/terms.html" className="text-sm text-textSecondary hover:text-primary transition-colors">Terms of Service</a>
                            <a href="#delete" className="text-sm text-textSecondary hover:text-primary transition-colors">Data Deletion</a>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="text-[13px] font-bold uppercase tracking-[1px] text-textSecondary/70 mb-4 font-sans">Support</h4>
                        <div className="flex flex-col gap-2.5">
                            <a href="mailto:jbbari03@gmail.com" className="text-sm text-textSecondary hover:text-primary transition-colors">Contact Us</a>
                            <a href="mailto:jbbari03@gmail.com" className="text-sm text-textSecondary hover:text-primary transition-colors">Support</a>
                            <a href="#data" className="text-sm text-textSecondary hover:text-primary transition-colors">Data Policy</a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[13px] text-textSecondary/70 font-sans">© 2026 Your AI Coach. All rights reserved.</p>
                    <div className="flex gap-4 flex-wrap">
                        <a href="/privacy-policy.html" className="text-[13px] text-textSecondary/70 hover:text-textPrimary transition-colors">Privacy Policy</a>
                        <a href="/terms.html" className="text-[13px] text-textSecondary/70 hover:text-textPrimary transition-colors">Terms of Service</a>
                        <a href="mailto:jbbari03@gmail.com" className="text-[13px] text-textSecondary/70 hover:text-textPrimary transition-colors">jbbari03@gmail.com</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
