import { motion } from '../lib/motion';

const stats = [
  {
    value: '7-day',
    unit: 'free trial',
    label: 'Eligible Storefront Accounts',
    detail: 'The app surfaces the free trial only when the store returns a zero-price introductory offer and confirms that account is eligible.',
  },
  {
    value: '1 call',
    unit: 'up to 5 min',
    label: 'Complimentary Onboarding Call',
    detail: 'Instead of starting the trial immediately, an eligible non-subscriber can test one coach call first. An unanswered ring may be retried.',
  },
  {
    value: '350',
    unit: 'min / month',
    label: 'IZEM Elite Voice Coaching',
    detail: 'The current Elite paywall advertises up to 350 live voice-coaching minutes each month, with focused calls up to 15 minutes.',
  },
  {
    value: 'Optional',
    unit: '',
    label: 'Apple Health Context',
    detail: 'On supported iPhones, separate permission can provide steps, exercise, sleep, workouts, resting heart rate, HRV and body-mass context when available.',
  },
];

export default function Stats() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 border-y border-white/[0.06] bg-[#05080C]/90">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="p-6 sm:p-7 rounded-2xl specular-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-baseline gap-1 mb-2 font-mono">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#C8FF7E]">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-base sm:text-lg font-bold text-textSecondary font-sans">
                      {stat.unit}
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-textPrimary mb-1">
                  {stat.label}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed mt-2 font-normal">
                {stat.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
