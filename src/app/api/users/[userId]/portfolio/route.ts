import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { NextResponse } from 'next/server';

// GET /api/users/:userId/portfolio — get portfolio links
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const links = await prisma.portfolioLink.findMany({
    where: { userId: params.userId },
  });
  return NextResponse.json(links);
}

// POST /api/users/:userId/portfolio — save portfolio links (replace all)
export async function POST(request: Request, { params }: { params: { userId: string } }) {
  const [user] = await getServerUser();
  if (!user || user.id !== params.userId) {
    return NextResponse.json({}, { status: 401 });
  }

  const body = await request.json();
  const { links } = body;

  // Delete existing links and replace
  await prisma.portfolioLink.deleteMany({
    where: { userId: user.id },
  });

  if (links && links.length > 0) {
    await prisma.portfolioLink.createMany({
      data: links.map((link: { title: string; url: string; description?: string }) => ({
        title: link.title,
        url: link.url,
        description: link.description || null,
        userId: user.id,
      })),
    });
  }

  const saved = await prisma.portfolioLink.findMany({
    where: { userId: user.id },
  });

  return NextResponse.json(saved);
}
