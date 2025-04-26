// app/home/events/recordings/[eventId]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import { notFound, redirect } from "next/navigation";
import { RecordingPlayer } from "@/app/components/RecordingPlayer";
import {generateMediaUrl} from "@/lib/utils";

async function getEventRecording(eventId: string, userId: bigint | number | undefined) {
  try {
    const event = await prisma.events.findUnique({
      where: {
        id: parseInt(eventId),
      },
      select: {
        id: true,
        title: true,
        description: true,
        recordingUrl: true,
        allowRecordingAccess: true,
        userId: true,
        tickets: userId ? {
          where: {
            userId: userId,
            status: 'active'
          }
        } : undefined
      }
    });

    if (!event || !event.recordingUrl) {
      return null;
    }

    // Check if user is the creator or has a valid ticket
    const isCreator = userId && event.userId === userId;
    const hasValidTicket = userId && event.tickets && event.tickets.length > 0;

    // Only allow access if user is creator or has ticket AND recording access is enabled
    if (isCreator || (hasValidTicket && event.allowRecordingAccess)) {
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        recordingUrl: event.recordingUrl
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching event recording:", error);
    return null;
  }
}

export default async function RecordingPage({
                                              params,
                                              searchParams,
                                            }: {
  params: { eventId: string },
  searchParams: { accessCode?: string }
}) {
  const session = await getServerSession(authOptions);
  const accessCode = searchParams.accessCode;

  // Direct access for authenticated users who own the event or have tickets
  if (session?.user?.id) {
    const recording = await getEventRecording(params.eventId, session.user.id as number);

    if (!recording) {
      // If access code is provided but user can't directly access,
      // we'll try access code verification below
      if (!accessCode) {
        return notFound();
      }
    } else {
      // User has direct access, no need for access code
      return (
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold mb-4">{recording.title}</h1>
          <p className="text-gray-400 mb-8">{recording.description}</p>

          <RecordingPlayer
            recordingUrl={generateMediaUrl(recording.recordingUrl)}
            title={recording.title}
          />
        </div>
      );
    }
  }

  // If we reached here, direct access wasn't available, so check access code
  if (!accessCode) {
    // No access code provided, show the code entry form
    return (
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
        <AccessCodeForm eventId={params.eventId} />
      </div>
    );
  } else {
    // Verify access code
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/recordings/access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: params.eventId,
          accessCode: accessCode
        }),
      });

      if (!response.ok) {
        return (
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
            <h1 className="text-2xl font-bold mb-4">Invalid Access Code</h1>
            <p className="text-red-500 mb-6">The access code you provided is not valid.</p>
            <AccessCodeForm eventId={params.eventId} error="Invalid access code" />
          </div>
        );
      }

      const data = await response.json();

      return (
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold mb-4">{data.title}</h1>

          <RecordingPlayer
            recordingUrl={generateMediaUrl(data.recordingUrl)}
            title={data.title}
          />
        </div>
      );
    } catch (error) {
      console.error("Error validating access code:", error);
      return (
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500 mb-6">An error occurred while validating your access code.</p>
          <AccessCodeForm eventId={params.eventId} error="An error occurred. Please try again." />
        </div>
      );
    }
  }
}

// Access code entry form component
function AccessCodeForm({ eventId, error }: { eventId: string, error?: string }) {
  return (
    <div className="bg-black/20 rounded-lg p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Event Recording Access</h1>
      <p className="text-gray-400 mb-6">
        Please enter the access code that was sent to you to view this recording.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <form action={`/home/events/recordings/${eventId}`} method="get" className="space-y-4">
        <div>
          <label htmlFor="accessCode" className="block text-sm font-medium mb-1">
            Access Code
          </label>
          <input
            type="text"
            id="accessCode"
            name="accessCode"
            className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your access code"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          Access Recording
        </button>
      </form>
    </div>
  );
}
