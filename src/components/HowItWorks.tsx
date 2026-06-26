'use client';

/**
 * HowItWorks — Explains the pattern recognition mission to new builders.
 * Shows on the Feed page below the HQ Dashboard.
 */

import { useState } from 'react';

const dataLayers = [
  {
    icon: '📅',
    title: 'Timeline',
    short: 'Every event with a date',
    detail: 'Date, what happened, who did it, what resulted. The spine of every case. When you line up 10 timelines side by side, the patterns jump out.',
  },
  {
    icon: '👥',
    title: 'Actors',
    short: 'Everyone who touched the case',
    detail: 'Judges, commissioners, GALs, evaluators, CPS workers, attorneys. When the same actor shows up in 40 cases doing the same thing — that\'s not coincidence, that\'s policy.',
  },
  {
    icon: '📜',
    title: 'Orders',
    short: 'What was ordered, on what evidence',
    detail: 'Protection orders, custody orders, support calculations, contempt findings. Key question: was evidence required? Was a hearing held? Was the other side notified?',
  },
  {
    icon: '⚠️',
    title: 'Procedural Violations',
    short: 'Every time due process was skipped',
    detail: 'Ex parte orders without notice. Service defects. Hearings without counsel when jail is on the table. Financial declarations never requested before support orders.',
  },
  {
    icon: '💰',
    title: 'Financial Flow',
    short: 'Follow the money',
    detail: 'Support amounts vs. actual income. Title IV-D federal incentive payments — states get paid per dollar collected. Attorney fees that make it impossible to fight.',
  },
  {
    icon: '💔',
    title: 'Outcome',
    short: 'The human cost',
    detail: 'Days separated from children. Jobs lost, housing lost, incarceration. Total financial destruction. This is what the data proves — measured in lives.',
  },
  {
    icon: '📄',
    title: 'Documents',
    short: 'The evidence itself',
    detail: 'Court filings (OCR\'d and searchable), financial records, communications, screenshots. Raw proof that can\'t be argued with.',
  },
];

const patterns = [
  { label: 'Same actor, same behavior', example: 'Commissioner X issues ex parte orders in 85% of cases without notice' },
  { label: 'Same sequence', example: 'Protection order → custody flip → support order → contempt → jail' },
  { label: 'Same financial incentive', example: 'Every case where support exceeds income = Title IV-D revenue' },
  { label: 'Same procedural shortcut', example: 'Ex parte orders in X% of cases, hearings denied in Y%' },
  { label: 'Same outcome', example: 'Parent separated 200+ days in Z% of cases' },
];

export function HowItWorks() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-6 rounded-xl border border-border/20 bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h3 className="text-sm font-bold text-foreground">
            How Pattern Recognition Works
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            What we collect, why it matters, and how it proves systemic problems
          </p>
        </div>
        <span className="text-muted-foreground">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-border/10 px-5 pb-5">
          {/* Mission statement */}
          <div className="mb-4 mt-4 rounded-lg border border-primary/10 bg-primary/[0.03] p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">One case is a story. Ten cases are data. A hundred cases are proof.</strong>
              {' '}Case Builder turns individual fights into a network. When we document what happens across cases —
              same judges, same tactics, same outcomes — we can prove patterns that no single person could prove alone.
              That&apos;s not theory. That&apos;s evidence.
            </p>
          </div>

          {/* 7 data layers */}
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
            The 7 Data Layers We Collect Per Case
          </h4>
          <div className="mb-5 space-y-2">
            {dataLayers.map((layer) => (
              <details key={layer.title} className="group rounded-lg border border-border/15 bg-background/50">
                <summary className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="text-base">{layer.icon}</span>
                  <span className="font-medium text-foreground">{layer.title}</span>
                  <span className="text-xs text-muted-foreground/60">— {layer.short}</span>
                </summary>
                <p className="px-4 pb-3 pl-11 text-xs leading-relaxed text-muted-foreground">
                  {layer.detail}
                </p>
              </details>
            ))}
          </div>

          {/* What patterns look like */}
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
            What We&apos;re Looking For
          </h4>
          <div className="space-y-2">
            {patterns.map((p) => (
              <div key={p.label} className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] px-4 py-2.5">
                <p className="text-xs font-semibold text-emerald-400">{p.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">{p.example}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-4 rounded-lg border border-primary/15 bg-primary/[0.05] p-4 text-center">
            <p className="text-sm font-medium text-foreground">
              Have a case? Start by posting your timeline.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Even a rough list of dates and events helps. The tools do the rest.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
