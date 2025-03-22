// app/creator-home/events/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import { CreateEventDialog } from "@/app/components/creator-components/CreateEventDialog";
import { CreatorEventCard } from "@/app/components/creator-components/CreatorEventCard";

const PLATFORM_FEE_PERCENTAGE = 25;
// const CREATOR_PERCENTAGE = 100 - PLATFORM_FEE_PERCENTAGE;

async function getCreatorEvents(userId: number) {
    const events = await prisma.events.findMany({
        where: {
            userId: userId,
        },
        include: {
            tickets: true,
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

function calculateNetRevenue(totalAmount: number): number {
    const platformFee = (totalAmount * PLATFORM_FEE_PERCENTAGE) / 100;
    return totalAmount - platformFee;
}


export default async function CreatorEventsPage() {
    const session = await getServerSession(authOptions);
    const events = await getCreatorEvents(session?.user.id as number);

    return (
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Events</h1>
                <CreateEventDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {events.map((event: any) => {
                    const totalRevenue = event.tickets.length * event.price;
                    const netRevenue = calculateNetRevenue(totalRevenue);

                    return (
                        <CreatorEventCard
                            key={event.id}
                            event={event}
                            ticketsSold={event.tickets.length}
                            revenue={netRevenue}
                        />
                    );
                })}

                {events.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-black/20 rounded-lg">
                        <p className="text-gray-400">You haven't created any events yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
