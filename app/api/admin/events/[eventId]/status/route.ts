// app/api/admin/events/[eventId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/app/utils/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['upcoming', 'live', 'ended'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update event status
    const updatedEvent = await prisma.events.update({
      where: { id: eventId },
      data: {
        status,
        // If status is 'live', update isLive flag
        isLive: status === 'live'
      }
    });

    // If event is marked as ended, close all active stream sessions
    if (status === 'ended') {
      await prisma.streamSession.updateMany({
        where: {
          eventId,
          active: true
        },
        data: { active: false }
      });
    }

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Failed to update event status:', error);
    return NextResponse.json(
      { error: 'Failed to update event status' },
      { status: 500 }
    );
  }
}
