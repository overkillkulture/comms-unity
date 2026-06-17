import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { NextResponse } from 'next/server';

// GET /api/conversations — list all conversations for the current user
export async function GET() {
  const [user] = await getServerUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: { userId: user.id },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, username: true, profilePhoto: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: { id: true, name: true, username: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Shape the response
  const result = conversations.map((conv) => {
    const otherMembers = conv.members.filter((m) => m.userId !== user.id);
    const myMembership = conv.members.find((m) => m.userId === user.id);
    const lastMessage = conv.messages[0] || null;
    const hasUnread = lastMessage && myMembership
      ? lastMessage.createdAt > myMembership.lastReadAt
      : false;

    return {
      id: conv.id,
      name: conv.name || otherMembers.map((m) => m.user.name).join(', '),
      type: conv.type,
      members: conv.members.map((m) => m.user),
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            senderName: lastMessage.sender.name,
            createdAt: lastMessage.createdAt,
          }
        : null,
      hasUnread,
      updatedAt: conv.updatedAt,
    };
  });

  return NextResponse.json(result);
}

// POST /api/conversations — start a new conversation (DM or group)
export async function POST(request: Request) {
  const [user] = await getServerUser();
  if (!user) return NextResponse.json({}, { status: 401 });

  const body = await request.json();
  const { targetUserId, name, type = 'DM' } = body;

  if (type === 'DM' && targetUserId) {
    // Check if DM already exists between these two users
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DM',
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ id: existing.id });
    }
  }

  // Create new conversation
  const memberIds = type === 'DM'
    ? [user.id, targetUserId]
    : [user.id, ...(body.memberIds || [])];

  const conversation = await prisma.conversation.create({
    data: {
      name: type === 'GROUP' ? name : null,
      type,
      members: {
        create: memberIds.map((userId: string) => ({ userId })),
      },
    },
  });

  return NextResponse.json({ id: conversation.id });
}
