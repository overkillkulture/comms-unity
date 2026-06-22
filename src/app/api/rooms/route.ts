import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { NextResponse } from 'next/server';

// GET /api/rooms — list rooms the current user belongs to
export async function GET() {
  const [user] = await getServerUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const rooms = await prisma.conversation.findMany({
    where: {
      type: 'ROOM',
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

  const result = rooms.map((room) => {
    const myMembership = room.members.find((m) => m.userId === user.id);
    const lastMessage = room.messages[0] || null;
    const hasUnread = lastMessage && myMembership
      ? lastMessage.createdAt > myMembership.lastReadAt
      : false;

    return {
      id: room.id,
      name: room.name || 'Unnamed Room',
      description: room.description,
      type: room.type,
      members: room.members.map((m) => ({
        ...m.user,
        role: m.role,
      })),
      memberCount: room.members.length,
      myRole: myMembership?.role || 'member',
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            senderName: lastMessage.sender.name,
            createdAt: lastMessage.createdAt,
          }
        : null,
      hasUnread,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  });

  return NextResponse.json(result);
}

// POST /api/rooms — create a new private room
export async function POST(request: Request) {
  const [user] = await getServerUser();
  if (!user) return NextResponse.json({}, { status: 401 });

  const body = await request.json();
  const { name, description, memberIds = [] } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
  }

  // Create room with creator as owner + any invited members
  const allMemberIds = [user.id, ...memberIds.filter((id: string) => id !== user.id)];

  const room = await prisma.conversation.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      type: 'ROOM',
      createdById: user.id,
      members: {
        create: allMemberIds.map((userId: string, index: number) => ({
          userId,
          role: userId === user.id ? 'owner' : 'member',
        })),
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
    },
  });

  return NextResponse.json({
    id: room.id,
    name: room.name,
    description: room.description,
    members: room.members.map((m) => ({
      ...m.user,
      role: m.role,
    })),
  });
}
