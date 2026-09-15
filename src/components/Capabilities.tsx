import { motion } from '../lib/motion';
import {
  Apple,
  Brain,
  Camera,
  CheckCircle2,
  Dumbbell,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

type CapabilityGroup = {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  summary: string;
  items: string[];
};

const groups: CapabilityGroup[] = [
  {
    title: 'Coach, chat & live calls',
    eyebrow: 'COACH',
    icon: Phone,
    summary: 'One coach can use your training, nutrition, progress and saved coaching context instead of treating every conversation like a blank slate.',
    items: [
      'AI text chat plus live two-way voice conversations.',
      'Premium members can start a coach call; optional coach-initiated calls can support workouts and review moments when enabled.',
      'The current Elite paywall advertises up to 350 live voice-coaching minutes each month, with focused calls up to 15 minutes.',
      'Coach context can include today’s workout, meal plan, logged meals, recent performance, prior supported call summaries and useful saved preferences.',
      'A user-controlled coaching-intensity setting changes tone, directness, pacing and emotional intensity.',
    ],
  },
  {
    title: 'Training that records what you actually did',
    eyebrow: 'TRAINING',
    icon: Dumbbell,
    summary: 'The workout system is built around an executable weekly plan, not a one-off workout generator.',
    items: [
      'Weekly workout plans use your goals, experience level, available equipment, schedule, session duration and supplied constraints.',
      'Track sets, repetitions and load, with rest guidance and workout history.',
      'Full and partial workout completion can be recorded so the coach does not have to assume a session was all-or-nothing.',
      'Supported exercise swaps and workout-day changes can preserve the intended training target when plans need to change.',
      'Progression suggestions use logged performance and feedback; IZEM does not claim to measure bar speed or provide hands-on form supervision.',
    ],
  },
  {
    title: 'Nutrition, meal changes & grocery list',
    eyebrow: 'NUTRITION',
    icon: Utensils,
    summary: 'Meal planning is connected to the same profile as training and coaching.',
    items: [
      'Personalized meal plans use dietary preferences, allergies, meal count and calorie/macro targets.',
      'Meals can be logged and supported meals can be replaced or adjusted.',
      'A grocery list is generated from the active meal plan and stays in the nutrition workflow.',
      'Food-photo scans can estimate calories and macros; those values are estimates, not laboratory measurements.',
      'If you have an allergy or medical dietary requirement, ingredient labels and professional guidance still take priority over AI estimates.',
    ],
  },
  {
    title: 'Scans, progress & real history',
    eyebrow: 'PROGRESS',
    icon: Camera,
    summary: 'Visual tools add coaching context, while progress is grounded in data you actually log.',
    items: [
      'Food-photo scanning for calorie and macro estimates.',
      'Gym-equipment identification for general setup context and exercise ideas.',
      'Optional body-progress scans provide approximate visual baselines and trends, not medical measurements.',
      'Weight logging includes history/trend views, and the progress experience includes a current training streak.',
      'The coach can use recorded evidence such as completed training and logged nutrition instead of inventing progress that was never recorded.',
    ],
  },
  {
    title: 'Apple Health, only with separate permission',
    eyebrow: 'HEALTH CONTEXT',
    icon: Apple,
    summary: 'On supported iPhones, IZEM can read a bounded Apple Health overview after you separately choose to allow it.',
    items: [
      'Supported Health context includes steps/exercise minutes, sleep, workouts, resting heart rate, HRV and body mass when those data exist.',
      'Health access is read-only and permission-based; missing or denied data is not treated as a zero or a bad day.',
      'A minimized Health summary can support relevant coaching after separate consent rather than sending an entire Health history into every conversation.',
      'Apple Health is context for general fitness coaching, not diagnosis, treatment or emergency monitoring.',
    ],
  },
];

const truthNotes = [
  {
    icon: ShieldCheck,
    title: '7-day trial when eligible',
    text: 'The app reads the introductory offer from the storefront and only shows the free trial when the store confirms a zero-price one-week offer and that account is eligible.',
  },
  {
    icon: SlidersHorizontal,
    title: 'One free call before subscribing',
    text: 'At the end of onboarding, a non-member can choose the 7-day trial or test one complimentary coach call first. The connected test call is capped at 5 minutes.',
  },
  {
    icon: Brain,
    title: 'One connected profile',
    text: 'Training, meals, progress, scans, chat and eligible calls can use the same profile so the coach has context instead of asking you to re-explain everything.',
  },
];

export default function Capabilities() {
  return (
    <section id="capabilities" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#05080C] border-y border-white/[0.06]">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="max-w-4xl mx-auto text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-4">
            <CheckCircle2 size={13} />
            <span>CURRENT PRODUCT FACTS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-5">
            What IZEM Actually Does Today.
          </h2>
          <p className="text-base sm:text-lg text-textSecondary leading-relaxed">
            Specific capabilities, stated plainly. Availability can vary by platform, account and current storefront terms, so the app remains the authority for purchase eligibility and billing details.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {groups.map((group, index) => {
            const Icon = group.icon;
            return (
              <motion.article
                key={group.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className={`specular-card rounded-3xl p-6 sm:p-8 ${index === groups.length - 1 ? 'lg:col-span-2' : ''}`}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-primary mb-1">{group.eyebrow}</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-textPrimary tracking-tight">{group.title}</h3>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-textSecondary leading-relaxed mb-5">{group.summary}</p>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-textSecondary leading-relaxed">
                      <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mt-8">
          {truthNotes.map((note) => {
            const Icon = note.icon;
            return (
              <div key={note.title} className="rounded-2xl bg-white/[0.025] border border-white/[0.08] p-5 sm:p-6">
                <Icon size={18} className="text-secondary mb-3" />
                <h3 className="text-sm font-bold text-textPrimary mb-2">{note.title}</h3>
                <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">{note.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs sm:text-sm text-textSecondary">
          <a href="/izem-ai-fitness-coach/" className="text-primary font-semibold hover:text-[#A3FF85] transition-colors">Read the full product overview</a>
          <span className="hidden sm:inline text-white/20">•</span>
          <a href="/privacy-policy.html" className="hover:text-textPrimary transition-colors">Privacy & data controls</a>
          <span className="hidden sm:inline text-white/20">•</span>
          <a href="/terms.html" className="hover:text-textPrimary transition-colors">Safety & membership terms</a>
        </div>
      </div>
    </section>
  );
}
