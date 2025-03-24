// app/home/events/[eventId]/stream/page.tsx
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import {redirect} from "next/navigation";
import {CountdownTimer} from "@/app/components/CountdownTimer";
import {Badge} from "@/components/ui/badge";
import {StreamSection} from "@/app/components/streaming/StreamSection";

async function getEventWithTicket(eventId: string, userEmail: string) {
    const event = await prisma.events.findUnique({
        where: {
            id: parseInt(eventId),
        },
        include: {
            tickets: {
                where: {
                    user: {
                        email: userEmail,
                    },
                    status: 'active', // Only active tickets
                },
            },
        },
    });

    return event;
}

export default async function EventStreamPage({
                                                  params,
                                              }: {
    params: { eventId: string };
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect('/login');

    const event = await getEventWithTicket(params.eventId, session.user.email);

    if (!event) {
        redirect('/home/events');
    }

    const eventDate = new Date(event.date);
    const now = new Date();

    // Determine stream status
    const isLive = event.isLive && (event.activeStreams ?? 0) > 0;
    const showWaitingRoom = !isLive && now < eventDate;

    return (
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col space-y-6">
                {/* Header Section */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                        <div className="flex items-center gap-2">
                            <Badge variant={isLive ? "success" : "secondary"}>
                                {isLive ? "Live Now" : showWaitingRoom ? "Upcoming" : "Ended"}
                            </Badge>
                            {(event.activeStreams ?? 0) > 0 && (
                                <Badge variant="outline" className="bg-purple-500/20 text-purple-500">
                                    {event.activeStreams} Active {event.activeStreams === 1 ? 'Stream' : 'Streams'}
                                </Badge>
                            )}
                        </div>
                    </div>
                    {showWaitingRoom && <CountdownTimer targetDate={eventDate}/>}
                </div>

                {/* Stream Section */}
                <StreamSection
                    isLive={isLive}
                    showWaitingRoom={showWaitingRoom}
                    eventDate={eventDate}
                    description={event.description as string}
                    agoraChannel={event.agoraChannel as string}
                    eventId={params.eventId}
                    event={event}
                />

                {/* Description */}
                <div className="bg-black/20 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                    <p className="text-gray-400">{event.description}</p>
                </div>

                {isLive && (event.activeStreams ?? 0) > 1 && (
                    <div className="bg-black/20 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Active Co-Streamers</h2>
                        <p className="text-gray-400">
                            There are currently {event.activeStreams} active streamers in this event.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
