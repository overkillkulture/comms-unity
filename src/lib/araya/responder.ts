import prisma from '@/lib/prisma/prisma';
import { getPusher, CHANNELS, EVENTS } from '@/lib/pusher/server';
import { includeToComment } from '@/lib/prisma/includeToComment';
import { toGetComment } from '@/lib/prisma/toGetComment';

const ARAYA_CHAT_URL = process.env.ARAYA_CHAT_URL || 'https://conciousnessrevolution.io/.netlify/functions/araya-chat';
const ARAYA_USERNAME = 'araya';

/**
 * Check if a comment/post mentions ARAYA and trigger a response.
 * Runs asynchronously — doesn't block the original comment API.
 */
export async function maybeRespondAsAraya({
  content,
  postId,
  commentId,
}: {
  content: string;
  postId: number;
  commentId?: number;
}) {
  // Check if ARAYA is mentioned
  const mentionsAraya =
    content.toLowerCase().includes('@araya') ||
    content.toLowerCase().includes('araya,') ||
    content.toLowerCase().includes('araya?') ||
    content.toLowerCase().includes('araya!') ||
    content.toLowerCase().startsWith('araya');

  if (!mentionsAraya) return;

  // Find ARAYA's user account
  const arayaUser = await prisma.user.findUnique({
    where: { username: ARAYA_USERNAME },
  });
  if (!arayaUser) {
    console.error('[ARAYA] No araya user found in database');
    return;
  }

  try {
    // Call the ARAYA chat API
    const response = await fetch(ARAYA_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        mode: 'chat',
        context: 'community-platform',
      }),
    });

    if (!response.ok) {
      console.error('[ARAYA] Chat API returned', response.status);
      return;
    }

    const data = await response.json();
    const arayaReply = data.response || data.message || data.reply || 'I hear you. Let me think on that.';

    // Post ARAYA's response as a comment or reply
    let createdComment;
    if (commentId) {
      // Reply to the specific comment
      createdComment = await prisma.comment.create({
        data: {
          content: arayaReply,
          userId: arayaUser.id,
          parentId: commentId,
          postId,
        },
        include: includeToComment(arayaUser.id),
      });
    } else {
      // Comment on the post directly
      createdComment = await prisma.comment.create({
        data: {
          content: arayaReply,
          userId: arayaUser.id,
          postId,
        },
        include: includeToComment(arayaUser.id),
      });
    }

    // Broadcast via Pusher for real-time
    const pusher = getPusher();
    if (pusher) {
      const commentData = await toGetComment(createdComment);
      if (commentId) {
        await pusher.trigger(CHANNELS.post(postId), EVENTS.NEW_REPLY, {
          parentId: commentId,
          reply: commentData,
        });
      } else {
        await pusher.trigger(CHANNELS.post(postId), EVENTS.NEW_COMMENT, commentData);
      }
    }

    console.log(`[ARAYA] Responded inline on post ${postId}`);
  } catch (err) {
    console.error('[ARAYA] Failed to respond inline:', err);
  }
}
