import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import { EventCard } from "@/app/components/EventCard";

async function getEvents(userId: number) {
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
            bookingDate: true,
            price: true,
            imageUrl: true,
            trailerUrl: true,
            totalTickets: true,
            availableTickets: true,
            commissionPercentage: true,
            streamUrl: true,
            isTopRated: true,
            soldOut:true,
            tickets: {
                where: {
                    userId: userId,
                }
            },
        },
        orderBy: [
            {
                isTopRated: 'desc', // TRUE values will come first
            },
            {
                date: 'desc',
            },
        ],
    }).then(events => events.map(event => ({
        ...event,
        price: Number(event.price), // Convert Decimal to number
        commissionPercentage: event.commissionPercentage ? Number(event.commissionPercentage) : null
    })));

    return events;
}

export default async function EventsPage() {
    const session = await getServerSession(authOptions);
    const events = await getEvents(session?.user?.id as number);

    const currentUser = session?.user ? {
        role: session.user.role,
        AFFCode: session.user.affiliateCode,
        email: session.user.email,
        id: session.user.id
    } : null;

    return (
        <div className="w-full px-4 md:px-8 py-8">
            <h1 className="text-2xl md:text-3xl font-semibold mb-6">
                Upcoming Events
            </h1>

            {events.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="bg-[#121212] rounded-lg overflow-hidden group
                                      transform transition-all duration-300 hover:scale-105"
                        >
                            <div className="aspect-[16/9] relative w-full">
                                <EventCard
                                    id={event.id}
                                    title={event.title}
                                    description={event.description}
                                    date={event.date}
                                    bookingDate={event.bookingDate}
                                    price={event.price}
                                    availableTickets={event.availableTickets}
                                    hasTicket={event.tickets.length > 0}
                                    userEmail={session?.user?.email as string}
                                    imageUrl={event.imageUrl as string}
                                    trailerUrl={event.trailerUrl as string}
                                    currentUser={currentUser}
                                    showActions
                                    isTopRated={event.isTopRated}
                                    soldOut={event.soldOut}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="w-full bg-black/20 rounded-lg p-8 text-center">
                    <p className="text-gray-400 text-lg">
                        No upcoming events available.
                    </p>
                    <p className="text-gray-500 mt-2">
                        Check back later for new events.
                    </p>
                </div>
            )}
        </div>
    );
}
