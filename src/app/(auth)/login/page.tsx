import { UserAuthForm } from '../UserAuthForm';

export const metadata = {
  title: 'Case Builder HQ — Join',
};

export default function Page() {
  return (
    <>
      {/* Logo / Brand */}
      <div className="mb-6 text-center">
        <div className="mb-1 text-4xl font-bold text-primary">
          Case Builder<span className="text-foreground/40 text-2xl ml-1">HQ</span>
        </div>
        <p className="text-[0.6rem] tracking-[0.2em] text-muted-foreground/40">
          SOVEREIGN SERVER
        </p>
      </div>

      {/* What is this */}
      <div className="mb-6 rounded-lg border border-primary/15 bg-card p-4 text-center">
        <p className="text-sm leading-relaxed text-card-foreground">
          Secure workspace for case builders. Upload evidence, find patterns,
          coordinate strategy, and file with the court — together.
        </p>
      </div>

      {/* Tools */}
      <div className="mb-6 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-primary/20 px-2.5 py-1 text-primary">AI Crunch</span>
        <span className="rounded-full border border-emerald-400/20 px-2.5 py-1 text-emerald-400">Pattern Library</span>
        <span className="rounded-full border border-purple-400/20 px-2.5 py-1 text-purple-400">Private Rooms</span>
        <span className="rounded-full border border-foreground/20 px-2.5 py-1">Evidence Snap</span>
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
