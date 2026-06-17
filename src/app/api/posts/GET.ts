/**
 * GET /api/posts
 * - Public feed: returns the most recent posts from all users.
 * - No authentication required — open community.
 */

import { usePostsSorter } from '@/hooks/usePostsSorter';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { selectPost } from '@/lib/prisma/selectPost';
import { toGetPost } from '@/lib/prisma/toGetPost';
import { NextResponse } from 'next/server';
import { GetPost } from '@/types/definitions';

export async function GET(request: Request) {
  const { filters, limitAndOrderBy } = usePostsSorter(request.url);

  // Get the current user if logged in (for like status), but don't require it
  const [user] = await getServerUser();

  const res = await prisma.post.findMany({
    where: {
      ...filters,
    },
    ...limitAndOrderBy,
    select: selectPost(user?.id),
  });

  const postsPromises = res.map(toGetPost);
  const posts = await Promise.all(postsPromises);

  return NextResponse.json<GetPost[]>(posts);
}
