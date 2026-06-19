'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import formatDistanceStrict from 'date-fns/formatDistanceStrict';
import SvgComment from '@/svg_components/Comment';
import { AnimatePresence, motion } from 'framer-motion';
import { GetPost, PostId } from '@/types/definitions';
import { isEqual } from 'lodash';
import SvgHeart from '@/svg_components/Heart';
import { useQuery } from '@tanstack/react-query';
import { usePostLikesMutations } from '@/hooks/mutations/usePostLikesMutations';
import { ToggleStepper } from './ui/ToggleStepper';
import { Comments } from './Comments';
import { PostVisualMediaContainer } from './PostVisualMediaContainer';
import ProfileBlock from './ProfileBlock';
import { HighlightedMentionsAndHashTags } from './HighlightedMentionsAndHashTags';
import { PostOptions } from './PostOptions';

export const Post = memo(
  ({
    id: postId,
    commentsShown,
    toggleComments,
  }: PostId & {
    toggleComments: (postId: number) => void;
  }) => {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { likeMutation, unLikeMutation } = usePostLikesMutations({ postId });
    const [expanded, setExpanded] = useState(false);

    const { data, isPending, isError } = useQuery<GetPost>({
      queryKey: ['posts', postId],
      queryFn: async () => {
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) {
          throw new Error('Error getting post');
        }
        return (await res.json()) as GetPost;
      },
      staleTime: 60000 * 10,
    });

    const likePost = useCallback(() => likeMutation.mutate(), [likeMutation]);
    const unLikePost = useCallback(() => unLikeMutation.mutate(), [unLikeMutation]);
    const handleLikeToggle = useCallback(
      (isSelected: boolean) => {
        if (!userId) {
          window.location.href = '/login';
          return;
        }
        if (isSelected) {
          likePost();
        } else {
          unLikePost();
        }
      },
      [userId, likePost, unLikePost],
    );
    const handleCommentsToggle = useCallback(() => {
      if (!userId) {
        window.location.href = '/login';
        return;
      }
      toggleComments(postId);
    }, [userId, postId, toggleComments]);
    const variants = useMemo(
      () => ({
        animate: {
          height: 'auto',
          overflow: 'visible',
        },
        exit: {
          height: 0,
          overflow: 'hidden',
        },
      }),
      [],
    );

    if (isPending) return <p>Loading...</p>;
    if (isError) return <p>Error loading post.</p>;
    if (!data) return <p>This post no longer exists.</p>;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { content, createdAt, user: author, visualMedia, isLiked, _count } = data;
    const isOwnPost = userId === author.id;
    const numberOfLikes = _count.postLikes;

    return (
      <div className="rounded-xl bg-card px-3 shadow sm:rounded-2xl sm:px-8">
        <div className="flex items-center justify-between pt-3 sm:pt-5">
          <ProfileBlock
            name={author.name!}
            username={author.username!}
            time={formatDistanceStrict(new Date(createdAt), new Date())}
            photoUrl={author.profilePhoto!}
          />
          {isOwnPost && <PostOptions postId={postId} content={content} visualMedia={visualMedia} />}
        </div>
        {content && (
          <div className="mb-4 mt-3">
            <p
              className={cn(
                'text-base text-muted-foreground sm:text-lg',
                !expanded && content.length > 280 && 'line-clamp-4',
              )}
            >
              <HighlightedMentionsAndHashTags text={content} shouldAddLinks />
            </p>
            {content.length > 280 && !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-1 text-sm font-medium text-primary hover:text-primary-accent"
              >
                Read more
              </button>
            )}
          </div>
        )}
        {visualMedia.length > 0 && (
          <div className="mb-4 mt-5 overflow-hidden rounded-2xl">
            <PostVisualMediaContainer visualMedia={visualMedia} />
          </div>
        )}
        <div
          className={cn([
            'flex justify-start gap-2 border-y border-y-border py-2',
            !commentsShown && 'border-b-transparent',
          ])}>
          <ToggleStepper
            isSelected={isLiked}
            onChange={handleLikeToggle}
            Icon={SvgHeart}
            quantity={numberOfLikes}
            // noun="Like"
          />
          <ToggleStepper
            isSelected={commentsShown || false}
            onChange={handleCommentsToggle}
            Icon={SvgComment}
            quantity={_count.comments}
            color="blue"
            // noun="Comment"
          />
        </div>

        <AnimatePresence>
          {commentsShown && (
            <motion.div key={`${postId}-comments`} variants={variants} initial={false} animate="animate" exit="exit">
              <Comments postId={postId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps),
);

Post.displayName = 'Post';
