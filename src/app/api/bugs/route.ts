import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { NextResponse } from 'next/server';

// GET /api/bugs — list bug reports (for admins later)
export async function GET() {
  const bugs = await prisma.bugReport.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: {
        select: { id: true, name: true, username: true },
      },
    },
  });
  return NextResponse.json(bugs);
}

// POST /api/bugs — submit a bug report (works for logged in AND anonymous)
export async function POST(request: Request) {
  const [user] = await getServerUser();
  const body = await request.json();
  const { title, description, page, priority } = body;

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
  }

  const bug = await prisma.bugReport.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      page: page || 'unknown',
      priority: priority || 'MEDIUM',
      reporterId: user?.id || null,
    },
  });

  return NextResponse.json(bug);
}
