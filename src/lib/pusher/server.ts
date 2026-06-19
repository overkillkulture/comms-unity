import Pusher from 'pusher';

let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher | null {
  if (!process.env.PUSHER_APP_ID) return null;

  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    });
  }

  return pusherInstance;
}

// Channel names
export const CHANNELS = {
  post: (postId: number) => `post-${postId}`,
  feed: 'feed',
} as const;

// Event names
export const EVENTS = {
  NEW_COMMENT: 'new-comment',
  NEW_REPLY: 'new-reply',
  POST_LIKED: 'post-liked',
  NEW_POST: 'new-post',
} as const;
