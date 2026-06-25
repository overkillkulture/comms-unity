import { cn } from '@/lib/cn';
import React from 'react';

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export function ResponsiveContainer({ children, ...rest }: ResponsiveContainerProps) {
  return (
    <div {...rest} className={cn('w-full flex-1 md:max-w-[900px] md:mx-auto', rest.className)}>
      {children}
    </div>
  );
}
