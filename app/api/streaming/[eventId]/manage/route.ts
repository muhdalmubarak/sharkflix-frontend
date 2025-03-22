// app/api/streaming/[eventId]/manage/route.ts
import {NextResponse} from 'next/server';
import prisma from '@/app/utils/db';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/app/utils/auth';
import {z} from 'zod';

const deviceTypes = ['webcam', 'mobile', 'screen'] as const;

const streamRequestSchema = z.object({
    deviceType: z.enum(deviceTypes),
    layout: z.enum(['grid', 'spotlight', 'sideBySide']).optional(),
});

export async function POST(
    request: Request,
    {params}: { params: { eventId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', {status: 401});
        }

        const body = await request.json();
        const {deviceType, layout} = streamRequestSchema.parse(body);
        const {streamData} = body;

        const result = await prisma.$transaction(async (tx) => {
            // First, get event info
            const event = await tx.events.findUnique({
                where: {
                    id: parseInt(params.eventId),
                }
            });

            if (!event) {
                throw new Error('Event not found');
            }

            // Find any existing session for this device type
            const existingSession = await tx.streamSession.findFirst({
                where: {
                    eventId: parseInt(params.eventId),
                    userId: session.user.id as number,
                    deviceType,
                }
            });

            if (existingSession) {
                // Update existing session instead of creating new one
                await tx.streamSession.update({
                    where: {id: existingSession.id},
                    data: {
                        active: true,
                        layout: layout || 'grid',
                    },
                });
            } else {
                // Create new session only if one doesn't exist
                await tx.streamSession.create({
                    data: {
                        eventId: event.id,
                        userId: session.user.id as number,
                        deviceType,
                        active: true,
                        layout: layout || 'grid'
                    }
                });
            }

            // Get current active streams count
            const activeStreams = await tx.streamSession.count({
                where: {
                    eventId: parseInt(params.eventId),
                    active: true
                }
            });

            // Update event status
            return await tx.events.update({
                where: {id: event.id},
                data: {
                    activeStreams,
                    isLive: activeStreams > 0,
                    status: activeStreams > 0 ? 'live' : 'upcoming',
                    streamId: streamData.result.uid,
                    streamVia: streamData.result.streamVia,
                    liveStreamURLs: streamData.result.liveStreamURLs
                }
            });
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error managing stream:', error);
        if (error instanceof z.ZodError) {
            return new NextResponse('Invalid request data', {status: 400});
        }
        return new NextResponse(
            error instanceof Error ? error.message : 'Internal Server Error',
            {status: error instanceof Error ? 400 : 500}
        );
    }
}

// End streaming - decrement activeStreams
export async function DELETE(
    request: Request,
    {params}: { params: { eventId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', {status: 401});
        }

        const body = await request.json();
        const {deviceType} = streamRequestSchema.parse(body);

        const result = await prisma.$transaction(async (tx: any) => {
            // End specific stream session
            await tx.streamSession.updateMany({
                where: {
                    eventId: parseInt(params.eventId),
                    userId: session.user.id as number,
                    deviceType,
                    active: true
                },
                data: {active: false}
            });

            // Get remaining active sessions count
            const activeStreams = await tx.streamSession.count({
                where: {
                    eventId: parseInt(params.eventId),
                    active: true
                }
            });

            // Update event status
            return await tx.events.update({
                where: {id: parseInt(params.eventId)},
                data: {
                    activeStreams,
                    isLive: activeStreams > 0,
                    status: activeStreams > 0 ? 'live' : 'upcoming'
                }
            });
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error ending stream:', error);
        if (error instanceof z.ZodError) {
            return new NextResponse('Invalid request data', {status: 400});
        }
        return new NextResponse('Internal Server Error', {status: 500});
    }
}
