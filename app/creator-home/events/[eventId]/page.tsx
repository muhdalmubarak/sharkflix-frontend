// app/creator-home/events/[eventId]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import { redirect } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { AgoraWebStream } from '@/app/components/streaming/AgoraWebStream';
import {CloudflareWebStream} from "@/app/components/streaming/CloudflareWebStream";

async function getEvent(eventId: string, userId: number) {
    const event = await prisma.events.findFirst({
        where: {
            id: parseInt(eventId),
            userId: userId,
        },
        include: {
            tickets: true,
            user: {
                select: {
                    id: true,
                    email: true
                }
            }
        },
    });

    // Convert Decimal to number for React rendering
    if (event) {
        return {
            ...event,
            commissionPercentage: event.commissionPercentage ? Number(event.commissionPercentage) : null
        };
    }
    return null;
}

export default async function CreatorEventPage({
   params
}: {
    params: { eventId: string }
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect('/login');

    const event = await getEvent(params.eventId, session.user.id);
    if (!event) redirect('/creator-home/events');

    const eventDate = new Date(event.date);
    const now = new Date();
    const canStream = now >= eventDate;

    return (
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                        <div className="flex gap-2">
                            <Badge variant={event.isLive ? "success" : "secondary"}>
                                {event.isLive ? "Live" : "Not Live"}
                            </Badge>
                            <Badge variant="outline">
                                {event.tickets.length} tickets sold
                            </Badge>
                            {event.activeStreams > 0 && (
                                <Badge variant="outline" className="bg-purple-500/20 text-purple-500">
                                    {event.activeStreams} Active {event.activeStreams === 1 ? 'Stream' : 'Streams'}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Stream Date</p>
                        <p className="font-semibold">{eventDate.toLocaleString()}</p>
                    </div>
                </div>

                {canStream ? (
                    <div className="space-y-4">
                        <CloudflareWebStream
                            channelName={event.agoraChannel}
                            eventId={event.id.toString()}
                            event={event}
                            isHost={true}
                        />
                        <div className="text-sm text-gray-400">
                            <p>Maximum co-streamers allowed: {event.maxCoStreamers}</p>
                            <p>Current active streams: {event.activeStreams}</p>
                        </div>
                    </div>
                ) : (
                    <div className="aspect-video bg-black/20 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-gray-400">Streaming will be available at the event time</p>
                            <p className="text-sm text-gray-500">{eventDate.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/20 p-4 rounded-lg">
                        <h2 className="text-lg font-semibold mb-2">Stream Stats</h2>
                        <div className="space-y-2">
                            <p>Active Streams: {event.activeStreams}</p>
                            <p>Maximum Co-Streamers: {event.maxCoStreamers}</p>
                            <p>Channel: {event.agoraChannel}</p>
                            <p>Status: {event.status}</p>
                        </div>
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg">
                        <h2 className="text-lg font-semibold mb-2">Event Details</h2>
                        <div className="space-y-2">
                            <p>Tickets Sold: {event.tickets.length}</p>
                            <p>Revenue: MYR {event.tickets.length * event.price}</p>
                            {event.isaffiliate && event.commissionPercentage && (
                                <p>Commission Rate: {event.commissionPercentage.toFixed(2)}%</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
