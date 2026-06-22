import { apiUrl } from '@/lib/apiUrl';
import { GetUser } from '@/types/definitions';

export async function getUser(userId?: string) {
  const res = await fetch(apiUrl(`/api/users/${userId}`));

  if (!res) throw new Error("Error getting logged in user's data.");
  return (await res.json()) as GetUser;
}
