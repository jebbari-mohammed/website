import { ArrowDown, CalendarDays, CheckCheck, ClipboardList, Dumbbell, Layers, MessageSquare, Phone, ShoppingBasket, SlidersHorizontal, Utensils } from 'lucide-react';

const diagrams = {
  workout: {
    label: 'Training, with context',
    icon: Dumbbell,
    inputs: ['Your equipment', 'Available time'],
    inputIcons: [Dumbbell, CalendarDays],
    center: 'Weekly workout plan',
    detail: 'Goals · schedule · experience',
    outputs: ['Log sets, reps and load', 'Review supported changes'],
    outputIcons: [ClipboardList, SlidersHorizontal],
  },
  nutrition: {
    label: 'From meal plan to grocery list',
    icon: Utensils,
    inputs: ['Food preferences', 'Meal targets'],
    inputIcons: [Utensils, ClipboardList],
    center: 'Personalized meal plan',
    detail: 'Preferences · allergies · targets',
    outputs: ['Generated grocery list', 'Meal logs and adjustments'],
    outputIcons: [ShoppingBasket, CheckCheck],
  },
  chat: {
    label: 'A connected coaching profile',
    icon: MessageSquare,
    inputs: ['Training history', 'Meal context'],
    inputIcons: [Dumbbell, Utensils],
    center: 'Relevant coaching context',
    detail: 'Current plans · logs · preferences',
    outputs: ['AI text conversations', 'Eligible two-way voice calls'],
    outputIcons: [MessageSquare, Phone],
  },
};

export default function CoachingDiagram({ mode }: { mode: keyof typeof diagrams }) {
  const diagram = diagrams[mode];
  const Icon = diagram.icon;
  return (
    <figure data-izem-feature-diagram={mode} className="relative rounded-[28px] border border-primary/20 bg-gradient-to-b from-[#14221C] via-[#0B1212] to-[#080D12] p-5 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between gap-4 mb-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Feature diagram</span>
        <Icon aria-hidden="true" size={24} className="text-primary" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold leading-tight text-textPrimary mb-7">{diagram.label}</h3>
      <div className="grid !grid-cols-2 gap-3">
        {diagram.inputs.map((input, index) => {
          const InputIcon = diagram.inputIcons[index];
          return <div key={input} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><InputIcon aria-hidden="true" size={22} className="text-textSecondary mb-3" /><p className="text-xs sm:text-sm text-textPrimary font-medium">{input}</p></div>;
        })}
      </div>
      <div className="flex justify-center py-4"><ArrowDown aria-hidden="true" size={24} className="text-primary/60" /></div>
      <div className="rounded-2xl border border-primary/40 bg-primary/[0.08] p-5 text-center">
        <Layers aria-hidden="true" size={28} className="text-primary mx-auto mb-3" />
        <p className="text-base sm:text-lg font-bold text-textPrimary">{diagram.center}</p>
        <p className="text-[11px] sm:text-xs text-textSecondary mt-2 leading-relaxed">{diagram.detail}</p>
      </div>
      <div className="flex justify-center py-4"><ArrowDown aria-hidden="true" size={24} className="text-primary/60" /></div>
      <div className="space-y-3">
        {diagram.outputs.map((output, index) => {
          const OutputIcon = diagram.outputIcons[index];
          return <div key={output} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3"><OutputIcon aria-hidden="true" size={18} className="text-primary shrink-0" /><p className="text-xs sm:text-sm text-textSecondary">{output}</p></div>;
        })}
      </div>
      <figcaption className="text-[11px] leading-relaxed text-textSecondary text-center pt-5 mt-5 border-t border-white/[0.08]">Illustrative feature diagram, not an app screenshot.</figcaption>
    </figure>
  );
}
