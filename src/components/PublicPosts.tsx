'use client';

import { InfiniteData, QueryKey, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { GetPost, PostIds } from '@/types/definitions';
import { useEffect, useMemo, useRef } from 'react';
import useOnScreen from '@/hooks/useOnScreen';
import { AnimatePresence, motion } from 'framer-motion';
import { POSTS_PER_PAGE } from '@/constants';
import { postFramerVariants } from '@/lib/framerVariants';
import { SomethingWentWrong } from './SometingWentWrong';
import { AllCaughtUp } from './AllCaughtUp';
import { Post } from './Post';
import { GenericLoading } from './GenericLoading';

export function PublicPosts() {
  const qc = useQueryClient();
  const queryKey = useMemo(() => ['posts', 'public'], []);
  const bottomElRef = useRef<HTMLDivElement>(null);
  const isBottomOnScreen = useOnScreen(bottomElRef);

  const {
    data,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PostIds, Error, InfiniteData<PostIds>, QueryKey, number>({
    queryKey,
    defaultPageParam: 0,
    queryFn: async ({ pageParam: cursor }): Promise<PostIds> => {
      const params = new URLSearchParams('');
      params.set('limit', POSTS_PER_PAGE.toString());
      params.set('cursor', cursor.toString());
      params.set('sort-direction', 'desc');

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw Error('Failed to load posts.');
      const posts = (await res.json()) as GetPost[];

      return posts.map((post) => {
        qc.setQueryData(['posts', post.id], post);
        return { id: post.id, commentsShown: false };
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage.slice(-1)[0].id;
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (isBottomOnScreen && hasNextPage) fetchNextPage();
  }, [isBottomOnScreen, hasNextPage, fetchNextPage]);

  return (
    <>
      <div className="flex flex-col">
        {isPending ? (
          <GenericLoading>Loading posts</GenericLoading>
        ) : (
          <AnimatePresence>
            {data?.pages.map((page) =>
              page.map((post) => (
                <motion.div
                  variants={postFramerVariants}
                  initial="start"
                  animate="animate"
                  exit="exit"
                  key={post.id}>
                  <Post id={post.id} commentsShown={post.commentsShown} toggleComments={() => {}} />
                </motion.div>
              )),
            )}
          </AnimatePresence>
        )}
      </div>
      <div className="min-h-[16px]" ref={bottomElRef} style={{ display: data ? 'block' : 'none' }}>
        {isFetchingNextPage && <GenericLoading>Loading more posts...</GenericLoading>}
      </div>
      {isError && <SomethingWentWrong />}
      {!isPending && !isFetchingNextPage && !hasNextPage && <AllCaughtUp />}
    </>
  );
}
