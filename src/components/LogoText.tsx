import { cn } from '@/lib/cn';
import React from 'react';

const instanceName = process.env.INSTANCE_NAME || 'Sovereign Server';
const isHQ = process.env.INVITE_ONLY === 'true';

interface LogoTextProps extends React.HTMLAttributes<HTMLHeadElement> {}
export function LogoText({ ...rest }: LogoTextProps) {
  if (isHQ) {
    return (
      <h1 {...rest} className={cn('font-bold text-primary', rest.className)}>
        Case Builder<span className="text-foreground/40 text-[0.5em] ml-1">HQ</span>
      </h1>
    );
  }
  return (
    <h1 {...rest} className={cn('font-bold text-primary', rest.className)}>
      {instanceName}
    </h1>
  );
}
