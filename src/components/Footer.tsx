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
                            <span className="text-base font-bold font-condensed tracking-wide text-textPrimary">IZEM</span>
                        </div>
                        <p className="text-sm text-textSecondary leading-[1.7] max-w-[300px]">
                            Premium AI personal training with proactive calls, daily review, personalized workouts, practical meals, scans, and weekly plan adaptation.
                            <br /><br />
                            <span className="text-[11px] opacity-70">
                                <strong>Note:</strong> We are a consumer fitness application, not affiliated with the B2B consulting firm youraicoach.ai.
                            </span>
                            <br />
                            <span className="text-[11px] opacity-70 block mt-2">
                                <strong>Location:</strong> Casablanca, Morocco
                            </span>
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="text-[13px] font-bold uppercase tracking-[1px] text-textSecondary/70 mb-4 font-sans">App</h4>
                        <div className="flex flex-col gap-2.5">
                            <a href="https://apps.apple.com/app/your-ai-coach" className="text-sm text-textSecondary hover:text-primary transition-colors">App Store</a>
                            <a href="https://play.google.com/store/apps/details?id=com.ai.gym.coach" className="text-sm text-textSecondary hover:text-primary transition-colors">Google Play</a>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="text-[13px] font-bold uppercase tracking-[1px] text-textSecondary/70 mb-4 font-sans">Guides</h4>
                        <div className="flex flex-col gap-2.5">
                            <a href="/fitness-app-that-calls-you/" className="text-sm text-textSecondary hover:text-primary transition-colors font-medium text-primary">Fitness App That Calls You</a>
                            <a href="/features/ai-voice-calls" className="text-sm text-textSecondary hover:text-primary transition-colors">AI Voice Calls</a>
                            <a href="/best-ai-fitness-app" className="text-sm text-textSecondary hover:text-primary transition-colors">Best AI Fitness App</a>
                            <a href="/tools/" className="text-sm text-textSecondary hover:text-primary transition-colors">Free Fitness Calculators</a>
                            <a href="/blog/" className="text-sm text-textSecondary hover:text-primary transition-colors">Blog</a>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="text-[13px] font-bold uppercase tracking-[1px] text-textSecondary/70 mb-4 font-sans">Legal & Story</h4>
                        <div className="flex flex-col gap-2.5">
                            <a href="/about.html" className="text-sm text-textSecondary hover:text-primary transition-colors font-medium text-primary">About IZEM</a>
                            <a href="/privacy-policy.html" className="text-sm text-textSecondary hover:text-primary transition-colors">Privacy Policy</a>
                            <a href="/terms.html" className="text-sm text-textSecondary hover:text-primary transition-colors">Terms of Service</a>
                            <a href="#delete" className="text-sm text-textSecondary hover:text-primary transition-colors">Data Deletion</a>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <h4 className="text-[13px] font-bold uppercase tracking-[1px] text-textSecondary/70 mb-4 font-sans">Support</h4>
                        <div className="flex flex-col gap-2.5">
                            <a href="mailto:support@youraicoach.life" className="text-sm text-textSecondary hover:text-primary transition-colors">Contact Us</a>
                            <a href="mailto:support@youraicoach.life" className="text-sm text-textSecondary hover:text-primary transition-colors">Support</a>
                            <a href="#data" className="text-sm text-textSecondary hover:text-primary transition-colors">Data Policy</a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[13px] text-textSecondary/70 font-sans">© 2026 IZEM. All rights reserved.</p>
                    <div className="flex gap-4 flex-wrap">
                        <a href="/about.html" className="text-[13px] text-textSecondary/70 hover:text-textPrimary transition-colors">About Us</a>
                        <a href="/privacy-policy.html" className="text-[13px] text-textSecondary/70 hover:text-textPrimary transition-colors">Privacy Policy</a>
                        <a href="/terms.html" className="text-[13px] text-textSecondary/70 hover:text-textPrimary transition-colors">Terms of Service</a>
                        <a href="mailto:support@youraicoach.life" className="text-[13px] text-textSecondary/70 hover:text-textPrimary transition-colors">support@youraicoach.life</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
