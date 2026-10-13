import { motion } from '../lib/motion';

const stats = [
  {
    value: '7-day',
    unit: 'free trial',
    label: 'Eligible Storefront Accounts',
    detail: 'When available, the app shows a free trial only if the store confirms a zero-price one-week offer and account eligibility. An eligible trial includes up to 15 voice minutes total.',
  },
  {
    value: '1 call',
    unit: 'up to 3 min',
    label: 'Complimentary Onboarding Call',
    detail: 'When offered during onboarding, an eligible non-subscriber can test one complimentary coach call, once. It is capped at three connected minutes.',
  },
  {
    value: '300',
    unit: 'min / month',
    label: 'IZEM Elite Voice Coaching',
    detail: 'A paid monthly subscription includes up to 300 live voice-coaching minutes per usage cycle, with individual calls capped at 15 minutes.',
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
    <section className="editorial-section editorial-membership" aria-label="Membership and eligibility">
      <div className="editorial-container editorial-membership-grid">
        {stats.map((stat) => (
          <motion.article key={stat.label} className="editorial-membership-item">
            <p className="editorial-membership-value">{stat.value} <span>{stat.unit}</span></p>
            <h3>{stat.label}</h3>
            <p>{stat.detail}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
