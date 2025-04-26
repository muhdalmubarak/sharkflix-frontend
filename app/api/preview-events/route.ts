// app/api/preview-events/route.ts
import { NextResponse } from 'next/server';
import prisma from "@/app/utils/db";
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic'; // Disable static optimization
export const fetchCache = 'force-no-store'; // Disable fetch caching

export async function GET() {
  const headersList = headers();

  try {
    const events = await prisma.events.findMany({
      where: {
        status: {
          not: 'ended'
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        price: true,
        imageUrl: true,
        availableTickets: true,
        isTopRated: true,
        soldOut:true,
      },
      orderBy: [
        {
          isTopRated: 'desc', // TRUE values will come first
        },
        {
          date: 'desc',
        },
      ],
      take: 3, // Limit to 3 events for preview
    });

    // Set cache control headers
    return new NextResponse(JSON.stringify(events), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching preview events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
