import { UserAuthForm } from '../UserAuthForm';

export const metadata = {
  title: 'Mission Control | Join the Builders',
};

export default function Page() {
  return (
    <>
      {/* Logo / Brand */}
      <div className="mb-6 text-center">
        <div className="mb-3 text-4xl font-bold text-primary">
          MISSION<span className="text-purple-400"> CONTROL</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Consciousness Revolution
        </p>
      </div>

      {/* What is this */}
      <div className="mb-6 rounded-lg border border-primary/15 bg-card p-4 text-center">
        <p className="text-sm leading-relaxed text-card-foreground">
          A command center for builders. Post what you&apos;re building.
          Find people who build what you need. Voice channels, DMs,
          and a marketplace — all open source.
        </p>
      </div>

      {/* The 3 → 7 → 13 → ∞ */}
      <div className="mb-6 flex justify-center gap-3 text-xs text-muted-foreground">
        <span className="rounded-full border border-primary/20 px-2 py-1 text-primary">3 Machines</span>
        <span className="rounded-full border border-purple-400/20 px-2 py-1 text-purple-400">7 Forges</span>
        <span className="rounded-full border border-warning/20 px-2 py-1 text-warning-foreground">13 Pillars</span>
        <span className="rounded-full border border-foreground/20 px-2 py-1">∞</span>
      </div>

      <UserAuthForm mode="login" />

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By joining you agree to our{' '}
        <a href="/terms" className="text-primary hover:underline" target="_blank">
          Terms
        </a>
        {' · '}
        The revolution doesn&apos;t need followers. It needs builders.
      </p>
    </>
  );
}
