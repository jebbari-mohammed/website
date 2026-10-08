import faq from '../content/homepage-faq.json';

export default function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#05080C] border-t border-white/[0.06]">
      <div className="max-w-4xl mx-auto">
        <h2 id="faq-heading" className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-10 sm:mb-14">
          {faq.heading}
        </h2>
        <div className="divide-y divide-white/10">
          {faq.items.map((item) => (
            <article key={item.id} data-izem-faq-item={item.id} className="py-7 first:pt-0 last:pb-0">
              <h3 id={`faq-${item.id}`} className="text-lg sm:text-xl font-bold text-textPrimary mb-3 scroll-mt-24">
                {item.question}
              </h3>
              <p data-izem-faq-answer className="text-sm sm:text-base text-textSecondary leading-relaxed max-w-3xl">
                {item.answer}
              </p>
              <a href={item.href} className="inline-block mt-3 text-sm font-semibold text-primary underline underline-offset-4 hover:text-textPrimary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                {item.linkLabel}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
