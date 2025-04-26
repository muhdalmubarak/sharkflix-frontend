// app/api/streaming/[eventId]/layout/route.ts
import { NextResponse } from 'next/server';
import prisma from "@/app/utils/db";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/auth';
import { z } from 'zod';

// Schema for layout validation
const layoutSchema = z.object({
  layout: z.enum(['grid', 'spotlight', 'sideBySide'])
});

// GET endpoint to fetch current layout
export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    // Get the current layout from the stream session
    const streamSession = await prisma.streamSession.findFirst({
      where: {
        eventId: parseInt(params.eventId),
        active: true
      },
      select: {
        layout: true
      }
    });

    return NextResponse.json({
      layout: streamSession?.layout || 'grid' // Default to grid if no layout set
    });
  } catch (error) {
    console.error('Error fetching layout:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST endpoint to update layout
export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { layout } = layoutSchema.parse(body);

    // Update all active stream sessions for this event
    const updatedSessions = await prisma.streamSession.updateMany({
      where: {
        eventId: parseInt(params.eventId),
        active: true
      },
      data: {
        layout
      }
    });

    return NextResponse.json({
      layout,
      updatedSessions: updatedSessions.count
    });
  } catch (error) {
    console.error('Error updating layout:', error);
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid layout value', { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
