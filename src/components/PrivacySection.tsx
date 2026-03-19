import { motion } from 'framer-motion';
import { User, Activity, Utensils, Smartphone, Camera } from 'lucide-react';

export default function PrivacySection() {
    return (
        <div className="flex flex-col">
            {/* DATA SECTION */}
            <section id="data" className="py-[100px] px-6">
                <div className="max-w-7xl mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[1.5px] text-primary mb-4 font-sans">
                            ✦ Data Transparency
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold font-condensed leading-[1.15] tracking-tight mb-4">
                            How We Use Your Data
                        </h2>
                        <p className="text-[17px] text-textSecondary max-w-[560px] leading-relaxed font-sans">
                            We believe in radical transparency. Here's exactly what we collect, why, and what we never do.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 mt-14">
                        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card rounded-[24px] p-8">
                            <h3 className="text-lg font-bold mb-5 flex items-center gap-2.5"><span className="text-xl">📥</span> What We Collect</h3>
                            <ul className="flex flex-col gap-3.5 text-sm text-textSecondary font-sans">
                                <li className="flex gap-2.5 items-start"><User size={18} className="shrink-0 text-textPrimary mt-0.5" /> Name and email address (from account sign-up)</li>
                                <li className="flex gap-2.5 items-start"><Activity size={18} className="shrink-0 text-textPrimary mt-0.5" /> Fitness profile: age, gender, height, weight, goals</li>
                                <li className="flex gap-2.5 items-start"><Utensils size={18} className="shrink-0 text-textPrimary mt-0.5" /> Dietary preferences and restrictions</li>
                                <li className="flex gap-2.5 items-start"><Smartphone size={18} className="shrink-0 text-textPrimary mt-0.5" /> App usage data (streaks, workout completions)</li>
                                <li className="flex gap-2.5 items-start"><Camera size={18} className="shrink-0 text-textPrimary mt-0.5" /> <span>Optional camera images — processed immediately and <strong className="text-textPrimary">never stored</strong></span></li>
                            </ul>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-primary/5 border border-primary/20 rounded-[24px] p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                            <h3 className="text-lg font-bold mb-5 flex items-center gap-2.5 text-primary"><span className="text-xl text-textPrimary">🚫</span> What We NEVER Do</h3>
                            <ul className="flex flex-col gap-3.5 text-sm text-textSecondary font-sans">
                                <li className="flex gap-2.5 items-start"><span className="text-primary font-bold mt-0.5">✗</span> Sell your personal data to advertisers</li>
                                <li className="flex gap-2.5 items-start"><span className="text-primary font-bold mt-0.5">✗</span> Share body images publicly or store them</li>
                                <li className="flex gap-2.5 items-start"><span className="text-primary font-bold mt-0.5">✗</span> Use your data for unrelated advertising</li>
                                <li className="flex gap-2.5 items-start"><span className="text-primary font-bold mt-0.5">✗</span> Share data with third parties (except AI processing)</li>
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* DELETION SECTION */}
            <section id="delete" className="py-[100px] px-6 bg-gradient-to-b from-transparent via-[#0C1232]/50 to-transparent">
                <div className="max-w-7xl mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[1.5px] text-primary mb-4 font-sans">
                            ✦ Your Rights
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold font-condensed leading-[1.15] tracking-tight mb-4">
                            How to Delete Your Data
                        </h2>
                        <p className="text-[17px] text-textSecondary max-w-[560px] leading-relaxed font-sans">
                            You have full control. Delete your account and all associated data at any time — instantly.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6 mt-14">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-[24px] p-8">
                            <div className="inline-block bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-3 py-1 rounded-full mb-4">Option 1 — Instant</div>
                            <h3 className="text-base font-bold mb-3 font-sans">Delete from the App</h3>
                            <ol className="flex flex-col gap-1.5 text-sm text-textSecondary pl-4 list-decimal marker:text-primary marker:font-bold font-sans">
                                <li>Open <strong className="text-textPrimary">Your AI Coach</strong> app</li>
                                <li>Go to <strong className="text-textPrimary">Profile</strong> (bottom navigation)</li>
                                <li>Scroll to the bottom</li>
                                <li>Tap <strong className="text-textPrimary">"Delete Account"</strong></li>
                                <li>Confirm deletion</li>
                            </ol>
                            <p className="mt-4 text-[13px] text-textSecondary leading-relaxed font-sans">This permanently and instantly deletes your account, all plans, fitness data, and personal information.</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="glass-card rounded-[24px] p-8">
                            <div className="inline-block bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-3 py-1 rounded-full mb-4">Option 2 — Email</div>
                            <h3 className="text-base font-bold mb-3 font-sans">Contact Support</h3>
                            <p className="text-sm text-textSecondary mb-3 font-sans">If you cannot access the app, email us at:</p>
                            <p className="text-[15px] font-semibold text-primary mb-3">jbbari03@gmail.com</p>
                            <p className="text-sm text-textSecondary leading-relaxed font-sans">Include: <strong className="text-textPrimary">Subject:</strong> "Data Deletion Request" and your registered email address. We will delete all data within <strong className="text-textPrimary">30 days</strong> and confirm by email.</p>
                            <p className="mt-3.5 text-[13px] text-cta font-sans">✓ Workout plans ✓ Meal plans ✓ Profile data ✓ Account ✓ All personal info</p>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
