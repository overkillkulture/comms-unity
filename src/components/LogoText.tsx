import { cn } from '@/lib/cn';
import React from 'react';

interface LogoTextProps extends React.HTMLAttributes<HTMLHeadElement> {}
export function LogoText({ ...rest }: LogoTextProps) {
  return (
    <h1 {...rest} className={cn('font-bold text-primary', rest.className)}>
      Case Builder<span className="text-foreground/40 text-[0.5em] ml-1">HQ</span>
    </h1>
  );
}
