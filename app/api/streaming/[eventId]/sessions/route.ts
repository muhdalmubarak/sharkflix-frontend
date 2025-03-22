// app/api/streaming/[eventId]/sessions/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/auth';
import prisma from '@/app/utils/db';

export async function GET(
    request: Request,
    { params }: { params: { eventId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const streamSessions = await prisma.streamSession.findMany({
            where: {
                eventId: parseInt(params.eventId),
                userId: session.user.id,
                active: true  // Add this to only get active sessions
            }
        });

        return NextResponse.json(streamSessions);
    } catch (error) {
        console.error('Error fetching stream sessions:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
