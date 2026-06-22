import { apiUrl } from '@/lib/apiUrl';
import { GetComment } from '@/types/definitions';

export async function getReplies({ parentId }: { parentId: number }) {
  const res = await fetch(apiUrl(`/api/comments/${parentId}/replies`));

  if (!res.ok) throw new Error('Error getting replies.');
  return (await res.json()) as GetComment[];
}
