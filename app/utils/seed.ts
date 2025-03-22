// app/utils/seed.ts
import prisma from "./db";

async function seedEvents() {
    try {
        // First get your user ID from the database
        // const user = await prisma.user.findFirst({
        //     where: {
        //         // You can filter by email or any other unique identifier
        //         email: "shayx_88268@mail.ru",
        //     }
        // });
        //
        // if (!user) {
        //     throw new Error("User not found");
        // }

        // await prisma.events.createMany({
        //     data: [
        //         {
        //             title: "Live Coding Workshop",
        //             description: "Join us for an interactive live coding session where we'll build a full-stack application.",
        //             date: new Date("2025-02-15T18:00:00Z"),
        //             price: 25,
        //             totalTickets: 100,
        //             availableTickets: 100,
        //             imageUrl: "https://example.com/event1.jpg",
        //             userId: user.id,
        //             status: "upcoming"
        //         },
        //         {
        //             title: "Tech Talk: Future of AI",
        //             description: "An in-depth discussion about the future of AI and its impact on software development.",
        //             date: new Date("2025-02-20T19:00:00Z"),
        //             price: 30,
        //             totalTickets: 150,
        //             availableTickets: 150,
        //             imageUrl: "https://example.com/event2.jpg",
        //             userId: user.id,
        //             status: "upcoming"
        //         },
        //     ],
        // });
        console.log("Seed data inserted successfully");
    } catch (error) {
        console.error("Error seeding data:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Execute if needed
seedEvents()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
