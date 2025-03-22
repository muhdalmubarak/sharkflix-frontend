// app/guest-event/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EventPreviewModal } from "@/app/components/EventPreviewModal";
import {useToast} from "@/hooks/use-toast";
import {PayHalalService} from "@/services/payhalal.service";
import { useSession } from "next-auth/react";

export default function GuestEventPage() {
  const { data: session } = useSession();
  const { toast } = useToast()
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");
  const refCode = searchParams.get("refCode");
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (!eventId) throw new Error("No event ID provided");

        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) throw new Error('Event not found');

        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
        setError(error instanceof Error ? error.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleBookingAttempt = async () => {
    const params = new URLSearchParams();
    params.set('eventId', eventId || '');

    if (refCode) {
      params.append('refCode', refCode);

      if (session?.user) {
        try {
          // Track affiliate
          await fetch('/api/affiliate-tracking', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({userId: session.user.id, refCode})
          });

          // Redirect to payment
          window.location.href = await PayHalalService.initiateTicketPayment({
            userEmail: session.user.email as string,
            eventId: Number(eventId),
            title: event.title,
            price: event.price
          });
        } catch (error) {
          console.error('Error:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process payment"
          });
        }
      }
    }

    router.push(`/signup?${params.toString()}`);
  };

  const guestUser = refCode ? {
    role: 'guest',
    AFFCode: refCode,
    email: null,
    id: null
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-red-500">{error || 'Event not found'}</p>
      </div>
    );
  }

  return (
    <EventPreviewModal
      open={true}
      onOpenChange={() => {}}
      title={event.title}
      description={event.description}
      trailerUrl={event.trailerUrl}
      date={event.date}
      bookingDate={event.bookingDate}
      price={Number(event.price)}
      availableTickets={event.availableTickets}
      isBookingOpen={new Date() >= new Date(event.bookingDate)}
      eventId={event.id}
      hasTicket={false}
      userEmail={null}
      imageUrl={event.imageUrl}
      showActions={true}
      currentUser={guestUser}
      onBookingAttempt={handleBookingAttempt}
      isGuestFlow={true}
      soldOut={event.soldOut}
    />
  );
}
