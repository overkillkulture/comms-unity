import React from 'react';

/**
 * /meet layout — no chrome, no auth gate, fullscreen.
 * Public URL anyone can hit to join a video meeting.
 */
export default function MeetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
