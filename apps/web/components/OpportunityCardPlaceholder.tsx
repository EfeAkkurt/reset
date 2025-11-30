import * as React from "react";

export default function OpportunityCardPlaceholder() {
  return (
    <article
      className="animate-pulse rounded-3xl border border-alpha-gold-16/40 bg-[var(--neutral-800)] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.45)]"
      aria-label="Opportunity placeholder"
    >
      <div className="h-4 w-32 rounded-full bg-white/10" />
      <div className="mt-4 h-6 w-48 rounded-full bg-white/10" />
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="h-10 rounded-2xl bg-white/5" />
        <div className="h-10 rounded-2xl bg-white/5" />
        <div className="h-10 rounded-2xl bg-white/5" />
      </div>
      <div className="mt-6 h-12 rounded-2xl bg-white/5" />
      <div className="mt-6 h-4 w-24 rounded-full bg-white/10" />
    </article>
  );
}
