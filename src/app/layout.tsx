import './globals.css';
import 'swiper/css';
import 'swiper/css/zoom';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'react-datepicker/dist/react-datepicker.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/cn';
import { Providers } from '@/components/Providers';
import { auth } from '@/auth';
import React from 'react';

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export const metadata = {
  title: 'Consciousness Revolution — Community',
  description: 'Build systems that turn survival into sovereignty. 3 → 7 → 13 → ∞',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en" className="dark overflow-y-scroll">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={cn('bg-background text-foreground', inter.className)}>
        <Providers session={session}>{children}</Providers>
        <script src="/bug-button.js" defer />
      </body>
    </html>
  );
}
