// app/api/admin/events/[eventId]/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/app/utils/db";

// GET /api/admin/events/[eventId]/tickets - Get all tickets for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = parseInt(params.eventId);
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const tickets = await prisma.tickets.findMany({
      where: {
        eventId,
        ...(status && { status }),
        ...(search && {
          OR: [
            { ticketCode: { contains: search, mode: 'insensitive' } },
            { user: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } }
                ]
              }}
          ]
        })
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        payment: {
          select: {
            amount: true,
            status: true,
            paymentMethod: true,
            transactionId: true,
            createdAt: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        purchaseDate: 'desc'
      }
    });

    // Get total count for pagination
    const total = await prisma.tickets.count({
      where: {
        eventId,
        ...(status && { status }),
        ...(search && {
          OR: [
            { ticketCode: { contains: search, mode: 'insensitive' } },
            { user: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } }
                ]
              }}
          ]
        })
      }
    });

    // Get event details
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: {
        title: true,
        date: true,
        totalTickets: true,
        availableTickets: true
      }
    });

    // Get tickets statistics
    const stats = await prisma.tickets.groupBy({
      by: ['status'],
      where: { eventId },
      _count: true
    });

    return NextResponse.json({
      tickets,
      event,
      stats: {
        total,
        ...(stats.reduce((acc, stat) => ({
          ...acc,
          [stat.status]: stat._count
        }), {}) as Record<string, number>)
      },
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/events/[eventId]/tickets/[ticketId] - Update ticket status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; ticketId: string } }
) {
  try {
    const ticketId = parseInt(params.ticketId);
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['active', 'used', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: { status }
    });

    // If ticket is cancelled, update event's available tickets
    if (status === 'cancelled') {
      await prisma.events.update({
        where: { id: parseInt(params.eventId) },
        data: {
          availableTickets: {
            increment: 1
          }
        }
      });
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Failed to update ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
