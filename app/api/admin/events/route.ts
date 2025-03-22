// app/api/admin/events/route.ts
import { NextResponse } from 'next/server';
import prisma from "@/app/utils/db";

// GET /api/admin/events - Get all events
export async function GET() {
  try {
    const events = await prisma.events.findMany({
      include: {
        tickets: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/admin/events - Create new event
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const event = await prisma.events.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        bookingDate: new Date(data.bookingDate),
        description: data.description,
        price: data.price,
        totalTickets: data.totalTickets,
        availableTickets: data.totalTickets, // Initially same as total
        imageUrl: data.imageUrl,
        streamUrl: data.streamUrl,
        trailerUrl: data.trailerUrl,
        userId: data.userId,
        isaffiliate: data.isaffiliate || false,
        commissionPercentage: data.commissionPercentage || null
      }
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
