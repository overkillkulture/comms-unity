'use client';

import { useSearchParams } from 'next/navigation';

export function InviteOnlyBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (error !== 'InviteOnly') return null;

  return (
    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
      <p className="text-sm font-semibold text-red-400">Access by Invitation Only</p>
      <p className="mt-1 text-xs text-red-300/70">
        This workspace is private. Contact the administrator for an invite.
      </p>
    </div>
  );
}
