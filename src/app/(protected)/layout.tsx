import { MenuBar } from '@/components/MenuBar';
import { MobileHeader } from '@/components/MobileHeader';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { useCheckIfRequiredFieldsArePopulated } from '@/hooks/useCheckIfRequiredFieldsArePopulated';
import React from 'react';

export default async function Layout({ children }: { children: React.ReactNode }) {
  // This runs only once on the initial load of this layout
  // e.g. when the user signs in/up or on hard reload
  await useCheckIfRequiredFieldsArePopulated();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileHeader />
      <MenuBar />

      <ResponsiveContainer className="pb-20 md:pb-4">{children}</ResponsiveContainer>
    </div>
  );
}
