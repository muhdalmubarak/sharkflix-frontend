// app/api/admin/mailings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from "@/app/utils/db";
import {authOptions} from "@/app/utils/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email ?? '' }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mailing = await prisma.mailing.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (!mailing) {
      return NextResponse.json({ error: 'Mailing not found' }, { status: 404 });
    }

    return NextResponse.json(mailing);
  } catch (error) {
    console.error('Error fetching mailing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mailing' },
      { status: 500 }
    );
  }
}
