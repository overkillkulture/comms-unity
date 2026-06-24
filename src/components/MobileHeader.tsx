'use client';

import Link from 'next/link';
import { Feather } from '@/svg_components';
import { LogoText } from './LogoText';

export function MobileHeader() {
  return (
    <div className="sticky top-0 z-[3] flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-2 backdrop-blur-md md:hidden">
      <Link href="/feed" className="flex items-center gap-2">
        <Feather className="h-8 w-8 stroke-primary" />
        <LogoText className="text-xl" />
      </Link>
      <div className="flex items-center gap-1.5">
        <a
          href="https://conciousnessrevolution.io/guardian/patterns-library.html"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-emerald-500/15 px-2 py-1.5 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/25"
        >
          Patterns
        </a>
        <a
          href="https://conciousnessrevolution.io/guardian/case-crunch.html"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-purple-500/15 px-2 py-1.5 text-xs font-bold text-purple-400 transition-colors hover:bg-purple-500/25"
        >
          Crunch
        </a>
        <a
          href="https://conciousnessrevolution.io/araya-chat.html"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-primary/15 px-2 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/25"
        >
          ARAYA
        </a>
        <a
          href="https://conciousnessrevolution.io/case.html"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-secondary px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-secondary-accent"
        >
          Case
        </a>
      </div>
    </div>
  );
}
