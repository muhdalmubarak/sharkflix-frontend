// app/api/events/recordings/access/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";

// Verify access code and return recording URL
export async function POST(request: Request) {
  try {
    const { accessCode, eventId } = await request.json();

    if (!accessCode || !eventId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get the session for authenticated users
    const session = await getServerSession(authOptions);

    // Find the event with matching access code
    const event = await prisma.events.findFirst({
      where: {
        id: parseInt(eventId),
        recordingAccessCode: accessCode,
        allowRecordingAccess: true
      },
      select: {
        id: true,
        title: true,
        recordingUrl: true,
        userId: true
      }
    });

    if (!event || !event.recordingUrl) {
      return new NextResponse("Invalid access code or recording not available", { status: 403 });
    }

    // // Log the access attempt for analytics
    // await prisma.recordingAccess.create({
    //   data: {
    //     eventId: event.id,
    //     userId: session?.user?.id || null,
    //     userEmail: session?.user?.email || null,
    //     accessCode,
    //     ipAddress: request.headers.get('x-forwarded-for') || null,
    //   }
    // });

    // Return recording URL and basic event info
    return NextResponse.json({
      eventId: event.id,
      title: event.title,
      recordingUrl: event.recordingUrl,
      // Include only necessary info for the player
    });
  } catch (error) {
    console.error("Error verifying recording access:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Get recording info if user owns the event or has a valid ticket
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');

    if (!eventId) {
      return new NextResponse("Missing event ID", { status: 400 });
    }

    // Check if user is event owner or has a valid ticket
    const event = await prisma.events.findUnique({
      where: {
        id: parseInt(eventId),
      },
      select: {
        id: true,
        title: true,
        recordingUrl: true,
        allowRecordingAccess: true,
        userId: true,
        tickets: {
          where: {
            userId: session.user.id,
            status: 'active'
          }
        }
      }
    });

    if (!event) {
      return new NextResponse("Event not found", { status: 404 });
    }

    // User must either own the event or have a valid ticket
    const isOwner = Number(event.userId) === session.user.id;
    const hasTicket = event.tickets.length > 0;

    if (!isOwner && !hasTicket) {
      return new NextResponse("Access denied", { status: 403 });
    }

    // Return recording info if available
    if (event.recordingUrl && (isOwner || event.allowRecordingAccess)) {
      return NextResponse.json({
        eventId: event.id,
        title: event.title,
        recordingUrl: event.recordingUrl,
        // Include only necessary info for the player
      });
    } else {
      return new NextResponse("Recording not available", { status: 404 });
    }
  } catch (error) {
    console.error("Error getting recording info:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
