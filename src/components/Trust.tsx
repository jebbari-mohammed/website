import { motion } from '../lib/motion';
import { Lock, Smartphone, Ban, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';

const trustItems = [
    { icon: Lock, title: "Data Encrypted", desc: "All data is stored with industry-standard encryption via Google Firebase." },
    { icon: Smartphone, title: "Images Not Stored", desc: "Body and food scan images are processed for the requested analysis and are not retained as stored photos." },
    { icon: Ban, title: "No Data Sales", desc: "We never sell, trade, or share your personal data with any third parties for advertising." },
    {
        icon: ShieldCheck,
        title: "Payment Safety",
        desc: "All transactions and premium upgrades are handled securely via Apple & Google. We never see or store your credit card details."
    },
    { 
        icon: Trash2, 
        title: "Delete Anytime", 
        desc: (
            <>
                Request full account and data deletion directly inside the app in seconds. Read our{" "}
                <a href="/privacy-policy.html" className="underline hover:text-primary transition-colors font-medium">
                    Privacy Policy
                </a>
                .
            </>
        ) 
    },
];

export default function Trust() {
    return (
        <section className="py-[100px] px-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-y border-white/5">
            <div className="max-w-7xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[1.5px] text-primary mb-4 font-sans">
                        ✦ Trust & Safety
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold font-condensed leading-[1.15] tracking-tight">
                        Built with your safety<br />in mind
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-14">
                    {trustItems.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className="glass-card rounded-[24px] p-6 text-center hover:-translate-y-1 transition-transform flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-14 h-14 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <Icon className="text-textPrimary" size={28} strokeWidth={1.5} />
                                    </div>
                                    <h4 className="text-[15px] font-bold mb-2 font-sans">{item.title}</h4>
                                </div>
                                <p className="text-[13px] text-textSecondary leading-relaxed font-sans mt-2">{item.desc}</p>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-12 bg-[#0C1232]/80 border-2 border-red-500/30 rounded-[20px] p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start sm:items-center shadow-[0_10px_40px_rgba(239,68,68,0.05)]"
                >
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="text-red-500" size={24} />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-white mb-1">Important Medical Disclaimer</h4>
                        <p className="text-sm text-textSecondary leading-relaxed">
                            IZEM provides general fitness and nutritional guidance based on user inputs and AI analysis. It is <strong>NOT</strong> a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before beginning any new exercise or diet programme, especially if you have a medical condition or injury.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
