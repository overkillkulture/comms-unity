import { redirect } from 'next/navigation';

export default async function Page() {
  // Send everyone straight to the feed — no gate, no landing page
  redirect('/feed');
}
