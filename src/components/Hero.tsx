import { motion } from 'framer-motion';

export default function Hero() {
    return (
        <section id="download" className="min-h-screen flex items-center pt-[120px] pb-[80px] px-6 relative overflow-hidden">
            {/* Decorative Orbs */}
            <div className="absolute w-[600px] h-[600px] -top-[200px] -right-[200px] rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.12),transparent_70%)] pointer-events-none" />
            <div className="absolute w-[500px] h-[500px] -bottom-[100px] -left-[150px] rounded-full bg-[radial-gradient(circle,rgba(124,92,252,0.12),transparent_70%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center z-10">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3.5 py-1.5 text-[13px] text-primary font-medium mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        AI-Powered Fitness Companion
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black font-condensed leading-[1.1] tracking-tight mb-5">
                        Train Smarter.<br />
                        <span className="text-gradient">Transform Faster.</span>
                    </h1>

                    <p className="text-lg text-textSecondary mb-10 max-w-md leading-relaxed font-sans">
                        AI-powered fitness guidance tailored to your body — personalized workout plans, meal plans, and smart coaching. All in one app.
                    </p>

                    <div className="flex flex-wrap gap-3.5">
                        <a href="https://apps.apple.com/app/your-ai-coach" className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-semibold bg-gradient-to-r from-primary to-secondary text-white shadow-[0_8px_32px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 transition-transform duration-200">
                            <span className="text-2xl">🍎</span>
                            <div className="flex flex-col leading-[1.2]">
                                <span className="text-[11px] opacity-80 font-normal">Download on the</span>
                                <span>App Store</span>
                            </div>
                        </a>

                        <a href="https://play.google.com/store/apps/details?id=com.ai.gym.coach" className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-semibold glass-card hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 text-white">
                            <span className="text-2xl">▶</span>
                            <div className="flex flex-col leading-[1.2]">
                                <span className="text-[11px] opacity-80 font-normal">Get it on</span>
                                <span>Google Play</span>
                            </div>
                        </a>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="hidden md:flex justify-center gap-5 relative"
                >
                    {/* Phone Mockup 1 */}
                    <div className="relative w-[220px] h-[440px] rounded-[36px] bg-gradient-to-br from-bgPrimary to-black border-2 border-white/15 p-1.5 shadow-2xl translate-y-8 rotate-2 opacity-80">
                        <div className="w-full h-full rounded-[30px] border border-white/5 overflow-hidden p-4 pt-10 flex flex-col gap-3 relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-[16px] z-10" />
                            <div className="bg-cta/10 border border-cta/20 rounded-xl p-3">
                                <div className="text-[10px] text-cta font-bold uppercase tracking-wider mb-1 font-sans">Streak</div>
                                <div className="text-xl font-bold font-condensed">🔥 14 Days</div>
                            </div>
                            <div className="glass-card rounded-xl p-3">
                                <div className="text-[10px] text-textSecondary font-medium mb-1 font-sans">Workout Plan</div>
                                <div className="text-[13px] font-bold font-sans">Day 3 – Push</div>
                                <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary to-secondary w-[60%]" />
                                </div>
                            </div>
                            <div className="mt-auto bg-cta/15 border border-cta/25 rounded-lg px-2.5 py-2 flex items-center justify-center gap-1.5 text-[11px] text-cta font-bold font-sans">
                                ✓ AI Plan Active
                            </div>
                        </div>
                    </div>

                    {/* Phone Mockup 2 */}
                    <div className="relative w-[220px] h-[440px] rounded-[36px] bg-gradient-to-br from-bgPrimary to-black border-2 border-white/15 p-1.5 shadow-[0_32px_80px_rgba(0,0,0,0.5)] -translate-y-4 -rotate-2 z-10">
                        <div className="w-full h-full rounded-[30px] border border-white/5 overflow-hidden p-4 pt-10 flex flex-col gap-3 relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-[16px] z-10" />
                            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                                <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1 font-sans">Today's Calories</div>
                                <div className="text-xl font-bold font-condensed">1,840</div>
                            </div>
                            <div className="glass-card rounded-xl p-3">
                                <div className="text-[10px] text-textSecondary font-medium mb-1 font-sans">Protein Goal</div>
                                <div className="text-[13px] font-bold font-sans">142g / 160g</div>
                                <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary to-secondary w-[88%]" />
                                </div>
                            </div>
                            <div className="mt-auto bg-cta/15 border border-cta/25 rounded-lg px-2.5 py-2 flex items-center justify-center gap-1.5 text-[11px] text-cta font-bold font-sans">
                                ✓ Meal Plan Generated
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
