'use client';

import Button from '@/components/ui/Button';
import { Mail } from '@/svg_components';
import { useFollowsMutations } from '@/hooks/mutations/useFollowsMutations';
import { useUserQuery } from '@/hooks/queries/useUserQuery';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function ProfileActionButtons({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const { data: targetUser, isPending } = useUserQuery(targetUserId);
  const isFollowing = targetUser?.isFollowing;
  const { followMutation, unFollowMutation } = useFollowsMutations({
    targetUserId,
  });

  const handleClick = useCallback(() => {
    if (isFollowing) {
      unFollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  }, [isFollowing, followMutation, unFollowMutation]);

  const handleMessage = useCallback(async () => {
    // Create or find existing DM conversation, then navigate to messages
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, type: 'DM' }),
    });
    if (res.ok) {
      router.push('/messages');
    }
  }, [targetUserId, router]);

  return (
    <div className="flex flex-row items-center gap-2 md:gap-4">
      <Button onPress={handleClick} mode={isFollowing ? 'secondary' : 'primary'} shape="pill" loading={isPending}>
        {isFollowing ? 'Unfollow' : 'Follow'}
      </Button>
      <Button Icon={Mail} onPress={handleMessage} mode="secondary" shape="pill">
        Message
      </Button>
    </div>
  );
}
