// app/components/BookTicketButton.tsx
"use client";

import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {PayHalalService} from '@/services/payhalal.service';
import {useToast} from "@/hooks/use-toast";

interface BookTicketButtonProps {
    eventId: number;
    hasTicket: boolean;
    isAvailable: boolean;
    isBookingOpen: boolean;  // Add this prop
    soldOut: boolean; // Added this new prop
    userEmail?: string | null;
    title: string;  // Added for payment description
    price: number;  // Added for payment amount
    onSetReminder?: () => void; // Add this
    onBookingAttempt?: () => void;
    isGuestFlow?: boolean;
}

export function BookTicketButton({
    eventId,
    hasTicket,
    isAvailable,
    isBookingOpen,
     soldOut,
     userEmail,
    title,
    price,
    onSetReminder,
    onBookingAttempt,
    isGuestFlow = false,
}: BookTicketButtonProps) {
    const router = useRouter();
    const {toast} = useToast();

    const handleClick = async () => {
        // Handle reminder setting
        if (!isBookingOpen && onSetReminder) {
            onSetReminder();
            return;
        }

        // Handle stream access for ticket holders
        if (hasTicket) {
            router.push(`/home/events/${eventId}/stream`);
            return;
        }

        // Handle payment for available bookings
        if (isBookingOpen && isAvailable && !soldOut) {
            if (isGuestFlow && onBookingAttempt) {
                onBookingAttempt();
                return;
            }

            if (!userEmail) {
                router.push('/login');
                return;
            }

            await handlePayment();
        } else if (soldOut) {
            // You could add a waitlist option here
            toast({
                title: "Event Sold Out",
                description: "This event is sold out!",
            });
        }
    };

    const handlePayment = async () => {
        if (!eventId || isNaN(Number(eventId))) {
            console.error('Invalid event ID:', eventId);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Invalid event ID"
            });
            return;
        }

        if (!userEmail) {
            router.push('/login');
            return;
        }

        if (hasTicket) {
            router.push('/home/events/my-tickets');
            return;
        }

        try {
            window.location.href = await PayHalalService.initiateTicketPayment({
                userEmail,
                eventId,
                title,
                price
            });
        } catch (error) {
            console.error('Payment initialization failed:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to initialize payment"
            });
        }
   };

    const getButtonText = () => {
        if (hasTicket) return "Watch Stream";
        if (soldOut) return "Sold Out"; // Prioritize sold out status
        if (!isAvailable) return "Sold Out";
        if (!isBookingOpen) return "Set Reminder";
        return isGuestFlow ? "Signup first and book your ticket right now!" : "Book Now";
    };

    return (
        <Button
            onClick={handleClick}
            variant={hasTicket ? "secondary" : "destructive"}
            disabled={(!isAvailable && isBookingOpen) || soldOut}
            className="w-full flex items-center justify-center gap-2"
        >
            {getButtonText()}
        </Button>
    );
}
