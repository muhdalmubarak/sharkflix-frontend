// app/api/debug/stream/[eventId]/route.ts
import { NextResponse } from 'next/server';
import prisma from "@/app/utils/db";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/auth';
import {bigint} from "zod";

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
                id: parseInt(params.eventId),
            },
            select: {
                id: true,
                title: true,
                isLive: true,
                activeStreams: true,
                agoraChannel: true,
                status: true,
                userId: true,
                tickets: {
                    where: {
                        user: {
                            email: session.user.email
                        }
                    },
                    select: {
                        id: true,
                        status: true
                    }
                }
            }
        });

        if (!event) {
            return new NextResponse('Event not found', { status: 404 });
        }

        return NextResponse.json({
            event,
            userAccess: {
                isCreator: Number(event.userId) === session.user.id,
                hasTicket: event.tickets.length > 0,
                ticketStatus: event.tickets[0]?.status
            },
            streamStatus: {
                isLive: event.isLive,
                activeStreams: event.activeStreams,
                status: event.status
            }
        });
    } catch (error) {
        console.error('Debug route error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
