import { redirect } from 'next/navigation';

export default async function Page() {
  // Always start at login — the app is gated
  redirect('/login');
}
