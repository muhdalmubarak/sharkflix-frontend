import { Button } from "@/components/ui/button";
import prisma from "../../utils/db";
import { v4 as uuidv4 } from 'uuid';

export default function SeedDatabase() {
    async function postData() {
        "use server";
        // First get your user ID from the database
        const user = await prisma.user.findFirst({
            where: {
                // You can filter by email or any other unique identifier
                email: "example@admin.com",
            }
        });

        if (!user) {
            throw new Error("User not found");
        }

        // await prisma.events.createMany({
        //   data: [
        //       {
        //           title: "Live Coding Workshop",
        //           description: "Join us for an interactive live coding session where we'll build a full-stack application.",
        //           date: new Date("2025-02-15T18:00:00Z"),
        //           price: 25,
        //           totalTickets: 100,
        //           availableTickets: 100,
        //           imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop",
        //           userId: user.id,
        //           status: "upcoming"
        //       },
        //       {
        //           title: "Tech Talk: Future of AI",
        //           description: "An in-depth discussion about the future of AI and its impact on software development.",
        //           date: new Date("2025-02-20T19:00:00Z"),
        //           price: 30,
        //           totalTickets: 150,
        //           availableTickets: 150,
        //           imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop",
        //           userId: user.id,
        //           status: "upcoming"
        //       },
        //       {
        //           title: "Web Development Masterclass",
        //           description: "Master the latest web development technologies and frameworks in this comprehensive session.",
        //           date: new Date("2025-03-01T17:00:00Z"),
        //           price: 35,
        //           totalTickets: 80,
        //           availableTickets: 80,
        //           imageUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=2074&auto=format&fit=crop",
        //           userId: user.id,
        //           status: "upcoming"
        //       },
        //       {
        //           title: "Data Science Summit",
        //           description: "Explore the world of data science, machine learning, and analytics with industry experts.",
        //           date: new Date("2025-03-15T16:00:00Z"),
        //           price: 40,
        //           totalTickets: 120,
        //           availableTickets: 120,
        //           imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
        //           userId: user.id,
        //           status: "upcoming"
        //       }
        //   ],
        // });

        // Get the created events
        const createdEvents = await prisma.events.findMany();

        // Create tickets and payments for each event
        for (const event of createdEvents) {
            // Calculate number of tickets to create based on available vs total
            // const soldTickets = event.totalTickets - event.availableTickets;
            const soldTickets = 2;

            for (let i = 0; i < soldTickets; i++) {
                // Create ticket
                const ticket = await prisma.tickets.create({
                    data: {
                        ticketCode: uuidv4(),
                        qrCode: `${event.id}_${Date.now()}_${user.email}_${i}`,
                        status: event.date < new Date() ? 'used' : 'active',
                        eventId: event.id,
                        userId: user.id,
                        created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date within last 30 days
                    },
                });

                // Create corresponding payment
                await prisma.payments.create({
                    data: {
                        amount: event.price,
                        status: 'completed',
                        paymentMethod: 'payhalal',
                        transactionId: `MOCK_TX_${uuidv4()}`,
                        ticketId: ticket.id,
                        createdAt: ticket.created_at,
                    },
                });
            }
        }

        // Create some tickets with different statuses
        const upcomingEvent = createdEvents.find(e => e.status === 'upcoming');
        if (upcomingEvent) {
            // Create a cancelled ticket
            const cancelledTicket = await prisma.tickets.create({
                data: {
                    ticketCode: uuidv4(),
                    qrCode: `${upcomingEvent.id}_${Date.now()}_${user.email}_cancelled`,
                    status: 'cancelled',
                    eventId: upcomingEvent.id,
                    userId: user.id,
                    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
                },
            });

            // Create payment for cancelled ticket
            await prisma.payments.create({
                data: {
                    amount: upcomingEvent.price,
                    status: 'failed',
                    paymentMethod: 'payhalal',
                    transactionId: `MOCK_TX_${uuidv4()}`,
                    ticketId: cancelledTicket.id,
                    createdAt: cancelledTicket.created_at,
                },
            });
        }
        console.log("Seed data inserted successfully");
    }

    return (
        <div className="m-5">
            <form action={postData}>
                <Button type="submit">Submit</Button>
            </form>
        </div>
    );
}
