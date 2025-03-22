// app/api/admin/events/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/app/utils/db";

// GET /api/admin/events/[eventId] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = parseInt(params.eventId);
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        tickets: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/events/[eventId] - Update event
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = parseInt(params.eventId);
    const data = await request.json();

    const updatedEvent = await prisma.events.update({
      where: { id: eventId },
      data: {
        title: data.title,
        date: data.date ? new Date(data.date) : undefined,
        bookingDate: data.bookingDate ? new Date(data.bookingDate) : undefined,
        description: data.description,
        price: data.price,
        totalTickets: data.totalTickets,
        imageUrl: data.imageUrl,
        streamUrl: data.streamUrl,
        trailerUrl: data.trailerUrl,
        isaffiliate: data.isaffiliate,
        commissionPercentage: data.commissionPercentage
      }
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Failed to update event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/events/[eventId] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = parseInt(params.eventId);

    // Delete associated tickets first
    // await prisma.tickets.deleteMany({
    //   where: { eventId }
    // });

    // Delete associated stream sessions
    await prisma.streamSession.deleteMany({
      where: { eventId }
    });

    // Delete associated affiliate revenues
    // await prisma.affiliateRevenue.deleteMany({
    //   where: {
    //     sourceId: eventId,
    //     sourceType: 'event'
    //   }
    // });

    // Delete associated creator revenues
    // await prisma.creatorRevenue.deleteMany({
    //   where: {
    //     sourceId: eventId,
    //     sourceType: 'event'
    //   }
    // });

    // Finally delete the event
    await prisma.events.delete({
      where: { id: eventId }
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Failed to delete event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
