import { redirect } from 'next/navigation';

export default async function Page() {
  if (process.env.INVITE_ONLY === 'true') {
    // Invite-only: root goes straight to login (middleware handles the rest)
    redirect('/login');
  }
  // Open community: root goes to feed
  redirect('/feed');
}
