import { getServerUser } from '@/lib/getServerUser';
import { redirect } from 'next/navigation';
import { MessagesClient } from './MessagesClient';

export const metadata = {
  title: 'COMMS-UNITY | Messages',
};

export default async function Page() {
  const [user] = await getServerUser();
  if (!user) redirect('/login?from=/messages');

  return <MessagesClient userId={user.id} />;
}
