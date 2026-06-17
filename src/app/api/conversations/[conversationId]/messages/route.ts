import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { NextResponse } from 'next/server';

// GET /api/conversations/:id/messages — get messages for a conversation
export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } },
) {
  const [user] = await getServerUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const conversationId = parseInt(params.conversationId);

  // Verify user is a member
  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: user.id },
    },
  });
  if (!membership) return NextResponse.json([], { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const cursor = parseInt(searchParams.get('cursor') || '0');

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: {
        select: { id: true, name: true, username: true, profilePhoto: true },
      },
    },
  });

  // Mark as read
  await prisma.conversationMember.update({
    where: {
      conversationId_userId: { conversationId, userId: user.id },
    },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json(messages.reverse());
}

// POST /api/conversations/:id/messages — send a message
export async function POST(
  request: Request,
  { params }: { params: { conversationId: string } },
) {
  const [user] = await getServerUser();
  if (!user) return NextResponse.json({}, { status: 401 });

  const conversationId = parseInt(params.conversationId);
  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
  }

  // Verify user is a member
  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: user.id },
    },
  });
  if (!membership) return NextResponse.json({}, { status: 403 });

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      conversationId,
      senderId: user.id,
    },
    include: {
      sender: {
        select: { id: true, name: true, username: true, profilePhoto: true },
      },
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Mark as read for sender
  await prisma.conversationMember.update({
    where: {
      conversationId_userId: { conversationId, userId: user.id },
    },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json(message);
}
