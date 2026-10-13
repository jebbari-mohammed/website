import { useState } from 'react';
import { motion } from '../lib/motion';
import { ArrowRight, CheckCircle2, MessageSquare, Phone, PhoneCall, Shield, Sliders } from 'lucide-react';

interface CallScenario {
  id: 'preworkout' | 'userinitiated' | 'review';
  title: string;
  subtitle: string;
  badge: string;
  dialogue: {
    speaker: 'coach' | 'user';
    text: string;
  }[];
  demonstrates: string;
}

const scenarios: CallScenario[] = [
  {
    id: 'preworkout',
    title: 'Pre-Workout Call',
    subtitle: 'Illustrative example of an optional coach-initiated call around a planned training session.',
    badge: 'OPTIONAL PROACTIVE CALL',
    dialogue: [
      {
        speaker: 'coach',
        text: 'Your upper-body session is coming up. You logged the last one, so I can use that context instead of giving you a generic reminder. Are you still training today?',
      },
      {
        speaker: 'user',
        text: 'Yes, but I only have about half the time I planned.',
      },
      {
        speaker: 'coach',
        text: 'Then I can help you choose a shorter version. I’ll keep the important work and show you the proposed change before anything larger is saved.',
      },
    ],
    demonstrates: 'The call can use relevant workout context and respond to a real schedule change without pretending a plan change happened before confirmation.',
  },
  {
    id: 'userinitiated',
    title: 'You Call the Coach',
    subtitle: 'Illustrative example of a premium member starting a live coach call from the app.',
    badge: 'USER-INITIATED CALL',
    dialogue: [
      {
        speaker: 'user',
        text: 'I’m at the gym and the exercise in my plan is not available. What should I do?',
      },
      {
        speaker: 'coach',
        text: 'I can use today’s workout and your available-equipment context to help find a supported substitute that keeps the same training goal.',
      },
      {
        speaker: 'user',
        text: 'Give me the replacement.',
      },
      {
        speaker: 'coach',
        text: 'I’ll propose the supported swap and confirm what changed so your workout log stays consistent with the plan you are actually doing.',
      },
    ],
    demonstrates: 'Premium members can initiate the conversation instead of waiting for a scheduled reminder.',
  },
  {
    id: 'review',
    title: 'Day Review Call',
    subtitle: 'Illustrative example of a review that uses recorded evidence rather than inventing how the day went.',
    badge: 'REVIEW MOMENT',
    dialogue: [
      {
        speaker: 'coach',
        text: 'I can see the workout was logged as partial and that two meals were recorded. I won’t treat the missing data as a completed day.',
      },
      {
        speaker: 'user',
        text: 'I had to leave the gym early. I’ll finish the week normally.',
      },
      {
        speaker: 'coach',
        text: 'Got it. We can use what you actually completed when reviewing the week, rather than making up volume you did not perform.',
      },
    ],
    demonstrates: 'The coaching loop can distinguish full, partial, missed and uncertain workout states when the underlying evidence supports it.',
  },
];

export default function VoiceCallSection() {
  const [activeScenario, setActiveScenario] = useState<CallScenario['id']>('preworkout');
  const current = scenarios.find((scenario) => scenario.id === activeScenario) || scenarios[0];

  return (
    <section id="how-calls-work" className="editorial-section editorial-call">
      <div className="editorial-container">
        <div className="editorial-section-heading">
          <p className="editorial-eyebrow">
            <PhoneCall size={14} aria-hidden="true" />
            <span>LIVE COACH CONVERSATIONS</span>
          </p>
          <h2 className="editorial-title">You Can Call the Coach. The Coach Can Call You.</h2>
          <p className="editorial-intro">
            Premium members can start a live coach call. Optional proactive calls can also support planned-workout accountability and review moments when the account, platform, allowance, and call settings permit.
          </p>
        </div>

        <ol className="editorial-call-principles">
          <li className="editorial-call-principle">
            <span className="editorial-call-number" aria-hidden="true">01</span>
            <h3 className="editorial-call-principle-title">You Control Call Settings</h3>
            <p className="editorial-call-principle-description">
              Eligible workout and reminder-call preferences can be changed in the app. Delivery depends on account eligibility, supported platform settings, device permissions and connectivity.
            </p>
            <p className="editorial-call-principle-note">
              <Sliders size={14} aria-hidden="true" /> Optional scheduling
            </p>
          </li>

          <li className="editorial-call-principle">
            <span className="editorial-call-number" aria-hidden="true">02</span>
            <h3 className="editorial-call-principle-title">The Conversation Has Context</h3>
            <p className="editorial-call-principle-description">
              Supported calls can use relevant current-plan, meal, progress and saved coaching context. Voice calls do not receive Apple Health context in this release; separately consented Health context is limited to supported text coaching and requested workout changes.
            </p>
            <p className="editorial-call-principle-note">
              <MessageSquare size={14} aria-hidden="true" /> Context, not a blank call
            </p>
          </li>

          <li className="editorial-call-principle">
            <span className="editorial-call-number" aria-hidden="true">03</span>
            <h3 className="editorial-call-principle-title">Changes Stay Under Your Control</h3>
            <p className="editorial-call-principle-description">
              The coach can help with supported exercise, workout-day and meal changes. Larger or destructive changes should be previewed and confirmed before they are committed.
            </p>
            <p className="editorial-call-principle-note">
              <Shield size={14} aria-hidden="true" /> Confirmation before major changes
            </p>
          </li>
        </ol>

        <div className="editorial-call-examples">
          <div className="editorial-call-examples-heading">
            <div>
              <p className="editorial-eyebrow">Illustrative examples — not testimonials</p>
              <h3>What a context-aware call can look like</h3>
            </div>
            <div className="editorial-call-tabs" role="group" aria-label="Illustrative call scenarios">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => setActiveScenario(scenario.id)}
                  aria-pressed={activeScenario === scenario.id}
                  className={`editorial-call-tab${activeScenario === scenario.id ? ' is-active' : ''}`}
                >
                  {scenario.title}
                </button>
              ))}
            </div>
          </div>

          <div className="editorial-call-layout">
            <aside className="editorial-call-diagram" aria-label="Illustrative call flow">
              <div className="editorial-call-diagram-meta">
                <span>Illustrative call flow</span>
                <span className="editorial-call-diagram-status">Two-way audio</span>
              </div>
              <div className="editorial-call-diagram-avatar" aria-hidden="true">
                <Phone size={26} />
              </div>
              <h4 className="editorial-call-diagram-title">IZEM AI Coach</h4>
              <p className="editorial-call-diagram-badge">{current.badge}</p>

              <div className="editorial-call-waveform" aria-hidden="true">
                {[3, 6, 8, 5, 7, 4, 6].map((height, index) => (
                  <span key={index} style={{ height: `${height * 4}px` }} />
                ))}
              </div>

              <p className="editorial-call-diagram-flow">Workout context → conversation → supported adjustment</p>
              <p className="editorial-call-diagram-note">Illustrative feature diagram, not an app screenshot.</p>
            </aside>

            <div className="editorial-call-transcript">
              <p className="editorial-call-subtitle">{current.subtitle}</p>
              <div className="editorial-call-dialogue">
                {current.dialogue.map((item, index) => (
                  <motion.div
                    key={`${current.id}-${index}`}
                    initial={{ opacity: 0, x: item.speaker === 'coach' ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                    className={`editorial-call-line is-${item.speaker}`}
                  >
                    <span className="editorial-call-speaker">{item.speaker === 'coach' ? 'Coach' : 'You'}</span>
                    <p>{item.text}</p>
                  </motion.div>
                ))}
              </div>

              <div className="editorial-call-demonstrates">
                <CheckCircle2 size={17} aria-hidden="true" />
                <p>
                  <strong>What this example demonstrates: </strong>
                  <span>{current.demonstrates}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="editorial-call-footer">
            <p className="editorial-call-disclaimer">
              <Shield size={15} aria-hidden="true" />
              <span>Illustrative dialogue only. Exact call wording, availability and allowances vary with context and current account terms.</span>
            </p>
            <a href="/features/ai-voice-calls" className="editorial-link">
              <span>Voice-call details</span>
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
