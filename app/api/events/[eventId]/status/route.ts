// app/api/events/[eventId]/stream-status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";

export async function PATCH(
    request: Request,
    { params }: { params: { eventId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { isLive, activeStreams } = await request.json();

        // Verify event ownership
        const event = await prisma.events.findFirst({
            where: {
                id: parseInt(params.eventId),
                userId: session.user.id as number,
            },
        });

        if (!event) {
            return new Response("Event not found", { status: 404 });
        }

        // Update stream status
        const updatedEvent = await prisma.events.update({
            where: {
                id: parseInt(params.eventId),
            },
            data: {
                isLive,
                activeStreams: activeStreams ?? event.activeStreams,
                status: isLive ? 'live' : 'upcoming',
            },
        });

        return NextResponse.json(updatedEvent);
    } catch (error) {
        console.error("Error updating stream status:", error);
        return new Response("Error updating stream status", { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: { eventId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const event = await prisma.events.findUnique({
            where: {
                id: parseInt(params.eventId)
            },
            select: {
                id: true,
                isLive: true,
                activeStreams: true,
                status: true,
                date: true
            }
        });

        if (!event) {
            return new NextResponse('Event not found', { status: 404 });
        }

        // Update event status if needed
        const now = new Date();
        const eventDate = new Date(event.date);
        let status = event.status;
        let isLive = event.isLive;

        if (now >= eventDate && event.activeStreams > 0) {
            status = 'live';
            isLive = true;
        } else if (now < eventDate) {
            status = 'upcoming';
            isLive = false;
        } else if (now > eventDate && event.activeStreams === 0) {
            status = 'ended';
            isLive = false;
        }

        // Update if status changed
        if (status !== event.status || isLive !== event.isLive) {
            await prisma.events.update({
                where: { id: parseInt(params.eventId) },
                data: { status, isLive }
            });
        }

        return NextResponse.json({
            ...event,
            status,
            isLive
        });
    } catch (error) {
        console.error('Error fetching stream status:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
