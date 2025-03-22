// app/api/events/[eventId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import { z } from "zod";


// Schema for event validation
const eventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    date: z.string().or(z.date()),
    bookingDate: z.string().or(z.date()),
    price: z.number().min(0, "Price must be a positive number"),
    totalTickets: z.number().int().positive("Total tickets must be a positive integer"),
    imageUrl: z.string().optional().nullable(),
    trailerUrl: z.string().optional().nullable(),
    recordingUrl: z.string().optional().nullable(),
    allowRecordingAccess: z.boolean().optional().default(false),
    recordingAccessCode: z.string().optional().nullable(),
    streamUrl: z.string().optional().nullable(),
    isaffiliate: z.boolean().optional().default(false),
    commissionPercentage: z.number().optional().nullable(),
    soldOut: z.boolean().optional().default(false),
});

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
    try {
        // No session check for GET as this is public endpoint for guest users
        const event = await prisma.events.findUnique({
            where: {
                id: parseInt(params.eventId),
                status: {
                    not: 'cancelled'
                }
            },
            select: {
                id: true,
                title: true,
                description: true,
                date: true,
                bookingDate: true,
                price: true,
                totalTickets: true,
                availableTickets: true,
                imageUrl: true,
                trailerUrl: true,
                isaffiliate: true,
                commissionPercentage: true,
                status: true,
                recordingUrl: true,
                allowRecordingAccess: true,
                soldOut: true,
            }
        });

        if (!event) {
            return new NextResponse("Event not found", { status: 404 });
        }

        // Calculate if booking is open
        const isBookingOpen = new Date() >= new Date(event.bookingDate);

        const response = {
            ...event,
            isBookingOpen
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error("Error fetching event:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { eventId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new Response("Unauthorized", { status: 401 });
        }

        const rawData = await request.json();

        // Validate the input data
        const validationResult = eventSchema.safeParse(rawData);
        if (!validationResult.success) {
            console.error("Validation errors:", validationResult.error);
            return new Response(`Invalid data: ${validationResult.error.message}`, { status: 400 });
        }

        const data = validationResult.data;

        // Verify event ownership with proper user ID check
        const existingEvent = await prisma.events.findFirst({
            where: {
                id: parseInt(params.eventId),
                userId: (session.user as any).id, // Ensure proper type casting
            },
        });

        if (!existingEvent) {
            return new Response("Event not found or unauthorized", { status: 404 });
        }

        // Update event with explicit field selection
        const event = await prisma.events.update({
            where: {
                id: parseInt(params.eventId),
            },
            data: {
                title: data.title,
                description: data.description,
                date: new Date(data.date),
                bookingDate: new Date(data.bookingDate),
                price: data.price,
                totalTickets: data.totalTickets,
                imageUrl: data.imageUrl,
                trailerUrl: data.trailerUrl,
                recordingUrl: data.recordingUrl,
                allowRecordingAccess: data.allowRecordingAccess,
                recordingAccessCode: data.recordingAccessCode,
                streamUrl: data.streamUrl,
                isaffiliate: data.isaffiliate,
                commissionPercentage: data.commissionPercentage,
                soldOut: data.soldOut,
            },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error updating event:", error);
        return new Response(`Error updating event: ${error}`, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { eventId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new Response("Unauthorized", { status: 401 });
        }

        // First, get the event with its tickets
        const event = await prisma.events.findFirst({
            where: {
                id: parseInt(params.eventId),
                userId: session.user.id as number,
            },
            include: {
                tickets: true,
            },
        });

        if (!event) {
            return new Response("Event not found or unauthorized", { status: 404 });
        }

        // Check if event has sold tickets and hasn't ended yet
        const hasActiveTickets = event.tickets.length > 0;
        const eventNotEnded = new Date(event.date) > new Date();

        if (hasActiveTickets && eventNotEnded) {
            return new Response(
                "Cannot delete event: There are active tickets sold and the event hasn't ended yet",
                { status: 403 }
            );
        }

        // If validation passes, delete the event
        await prisma.events.delete({
            where: {
                id: parseInt(params.eventId),
            },
        });

        return new Response(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting event:", error);
        return new Response("Error deleting event", { status: 500 });
    }
}
