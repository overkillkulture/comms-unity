'use client';

/**
 * HowItWorks — Explains the pattern recognition mission to new builders.
 * Based on the UAS Guardian Forge Blueprint and the Loom Pattern Engine.
 */

import { useState } from 'react';

const dataLayers = [
  {
    icon: '📅',
    title: 'Timeline',
    short: 'Every event with a date',
    detail: 'Date, what happened, who did it, what resulted. When you line up 10 timelines side by side, the same move sequences appear across jurisdictions.',
  },
  {
    icon: '👥',
    title: 'Actors',
    short: 'Everyone who touched the case',
    detail: 'Judges, commissioners, GALs, evaluators, CPS workers, attorneys. When the same actor appears in 40 cases doing the same thing, that\'s not coincidence — that\'s policy. This is where cross-case patterns explode.',
  },
  {
    icon: '📜',
    title: 'Orders',
    short: 'What was ordered, on what evidence',
    detail: 'Protection orders, custody orders, support calculations, contempt findings. Key questions: Was evidence required? Was a hearing held? Was the other side notified? Was counsel provided when jail was on the table?',
  },
  {
    icon: '⚠️',
    title: 'Procedural Violations',
    short: 'Every time due process was skipped',
    detail: 'Ex parte orders without notice. Service defects. Hearings without counsel when incarceration is possible (Turner v. Rogers). Financial declarations never requested before support orders. Each violation is a constitutional claim.',
  },
  {
    icon: '💰',
    title: 'Financial Flow',
    short: 'Follow the money',
    detail: 'Support amounts vs. actual income. Title IV-D federal incentive payments — states get paid per dollar collected. Title IV-E — states get paid per child in placement. AFCC billing ecosystem — GALs, evaluators, coordinators all billing by the hour with incentive to extend.',
  },
  {
    icon: '💔',
    title: 'Outcome',
    short: 'The human cost, measured',
    detail: 'Days separated from children. Jobs lost, housing lost, incarceration. Total financial destruction. This is what the data proves when you stack it across cases — the system produces the same outcome because it\'s designed to.',
  },
  {
    icon: '📄',
    title: 'Documents',
    short: 'The evidence itself',
    detail: 'Court filings (OCR\'d and searchable), financial records, communications, screenshots. Raw proof uploaded, tagged, and cross-referenced so patterns can be detected across cases.',
  },
];

const confirmedPatterns = [
  { name: 'The Speech Trap', desc: 'A legal instrument written broadly enough that continued public speech becomes a criminal violation' },
  { name: 'Legal Instrument as Weapon', desc: 'Court orders obtained not to protect but to create a framework where protected conduct becomes criminal' },
  { name: 'Judicial Stacking', desc: 'Neutral judges replaced with judges aligned with the adverse party — without explanation' },
  { name: 'The Misdemeanor Cage', desc: 'Low-level charges used to justify detention that accomplishes the same as a felony — without the evidentiary burden' },
  { name: 'Child as Hostage', desc: 'Prolonged separation used as the central coercive instrument — not a byproduct, the primary weapon' },
  { name: 'Manufacture & Cite', desc: 'The system creates the circumstances, then cites those circumstances to justify escalation' },
  { name: 'The Pipeline', desc: 'All patterns operating together as a coordinated system — entry through one door activates all others' },
];

const systemicPatterns = [
  { name: 'AFCC Closed Loop', desc: 'Judge appoints GAL, GAL recommends evaluator, evaluator recommends therapist — all billing, all immune, all cross-referring' },
  { name: 'Title IV-D & IV-E', desc: 'Federal funding that pays states per child removed (IV-E) and per dollar of support collected (IV-D) — $10B+ annually' },
  { name: 'Record Elimination', desc: 'Court reporters removed from family court — no transcript means no appeal, no accountability' },
  { name: 'Immunity Shield', desc: 'Every actor operates with immunity — judges, GALs, evaluators, CPS, prosecutors. No civil recourse for documented harm' },
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
            What we collect, the patterns already confirmed, and how this proves systemic problems
          </p>
        </div>
        <span className="text-lg text-muted-foreground">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-border/10 px-5 pb-5">
          {/* Mission statement */}
          <div className="mb-5 mt-4 rounded-lg border border-primary/10 bg-primary/[0.03] p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">One case is a story. Ten cases are data. A hundred cases are proof.</strong>
              {' '}Abuse repeats. The same playbook runs against one person after another, in one county after another.
              We build the engine that recognizes the repetition, names the pattern, and hands the next person who hits it
              the counter that already worked. That&apos;s not theory — that&apos;s evidence.
            </p>
          </div>

          {/* How recognition works */}
          <div className="mb-5 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.02] p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-500/70">
              Shape, Not Identity
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              The engine matches the <strong className="text-foreground">shape of the moves</strong>, not names or places.
              Each event becomes a typed move: demand, ex-parte-filing, deprivation, escalation.
              The same pattern is recognized whether it runs in Spokane, San Diego, or Kansas — against anyone.
              A recognized pattern returns its counter-sequence: the legal response that already defeated it somewhere else.
            </p>
          </div>

          {/* 7 data layers */}
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
            The 7 Data Layers We Collect Per Case
          </h4>
          <div className="mb-5 space-y-1.5">
            {dataLayers.map((layer) => (
              <details key={layer.title} className="group rounded-lg border border-border/15 bg-background/50">
                <summary className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm">
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

          {/* Confirmed patterns */}
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
            Confirmed Patterns — Found Across Multiple Cases
          </h4>
          <div className="mb-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {confirmedPatterns.map((p) => (
              <div key={p.name} className="rounded-lg border border-red-500/10 bg-red-500/[0.03] px-3 py-2">
                <p className="text-xs font-semibold text-red-400">{p.name}</p>
                <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground/60">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Systemic patterns */}
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
            Systemic Architecture — Why It Keeps Happening
          </h4>
          <div className="mb-5 space-y-1.5">
            {systemicPatterns.map((p) => (
              <div key={p.name} className="rounded-lg border border-orange-500/10 bg-orange-500/[0.03] px-3 py-2.5">
                <p className="text-xs font-semibold text-orange-400">{p.name}</p>
                <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground/60">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* What builders do */}
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
            What You Do Here
          </h4>
          <div className="space-y-2">
            <div className="flex gap-3 rounded-lg border border-border/10 bg-background/30 px-4 py-3">
              <span className="text-base">1.</span>
              <div>
                <p className="text-xs font-medium text-foreground">Post your timeline</p>
                <p className="text-[0.7rem] text-muted-foreground/60">Even a rough list of dates and events. What happened, when, who did it.</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-border/10 bg-background/30 px-4 py-3">
              <span className="text-base">2.</span>
              <div>
                <p className="text-xs font-medium text-foreground">Upload your documents</p>
                <p className="text-[0.7rem] text-muted-foreground/60">Court filings, orders, financial records. They get OCR&apos;d and become searchable.</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-border/10 bg-background/30 px-4 py-3">
              <span className="text-base">3.</span>
              <div>
                <p className="text-xs font-medium text-foreground">Name the actors</p>
                <p className="text-[0.7rem] text-muted-foreground/60">Judges, GALs, evaluators, CPS workers. When the same names appear across cases, the network becomes visible.</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-border/10 bg-background/30 px-4 py-3">
              <span className="text-base">4.</span>
              <div>
                <p className="text-xs font-medium text-foreground">The system finds the patterns</p>
                <p className="text-[0.7rem] text-muted-foreground/60">Cross-case analysis identifies the same moves running across jurisdictions — and surfaces the counter that already worked.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-5 rounded-lg border border-primary/15 bg-primary/[0.05] p-4 text-center">
            <p className="text-sm font-medium text-foreground">
              The playbook repeats. So does the counter.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Have a case? Start by posting your timeline. The tools do the rest.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
