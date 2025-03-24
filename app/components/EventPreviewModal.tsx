// app/components/EventPreviewModal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import {useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import {BookTicketButton} from "@/app/components/BookTicketButton";
import Image from "next/image";
import {CheckCircle, Share2} from "lucide-react";
import  {USER_ROLES } from "@/app/utils/constants";
import {toast} from "@/hooks/use-toast";

interface EventPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    trailerUrl: string;
    imageUrl: string;
    date: string | Date; // Changed type to accept string
    bookingDate: string | Date; // Changed type to accept string
    price: number;
    soldOut: boolean;
    availableTickets: number;
    isBookingOpen: boolean;
    eventId: bigint | number;  // Add this
    hasTicket: boolean;  // Add this
    userEmail?: string | null;  // Add this
    showActions?: boolean; // Add this prop
    currentUser?: any;
    onBookingAttempt?: () => void;
    isGuestFlow?: boolean;
}

export function EventPreviewModal({
  open,
  onOpenChange,
  title,
  description,
  trailerUrl,
  date,
  bookingDate,
  price,
  soldOut,
  availableTickets,
  isBookingOpen,
  eventId,
  hasTicket,
  userEmail,
    imageUrl,
    showActions = true, // Default to true for regular users
    currentUser,
  onBookingAttempt,
  isGuestFlow = false
}: EventPreviewModalProps) {
    const [reminderSet, setReminderSet] = useState(false);
    const [copied, setCopied] = useState(false);
    const router = useRouter();
    const [shareLink, setShareLink] = useState('');

    const isCreator = currentUser?.role === USER_ROLES.CREATOR;
    const isAffiliate = currentUser?.role === USER_ROLES.AFFILIATE;
    const isUser = currentUser?.id; // Check if user is logged in

    const canShare = isCreator || isAffiliate || isUser; // Allow all logged-in users to share

    // Determine if booking should be allowed
    const isBookingAllowed = isBookingOpen && !soldOut && availableTickets > 0;

    useEffect(() => {
        setShareLink(`${process.env.NEXT_PUBLIC_MAIN_DOMAIN_URL}/guest-event?eventId=${eventId}`);
    }, [eventId]);

    // Update the handleShare function to use AFFCode
    const handleShare = () => {
        let finalLink = shareLink;
        // Add affiliate code for affiliate users
        if (isAffiliate && currentUser?.AFFCode) {
            finalLink += `&refCode=${currentUser.AFFCode}`;
        }

        navigator.clipboard.writeText(finalLink)
        .then(() => {
            setCopied(true);
            toast({
                title: "Link Copied",
                description: "Share link copied to clipboard"
            });
            setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
            console.error("Failed to copy link:", err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to copy share link"
            });
        });
    };

    const handleSetReminder = async () => {
        if (!userEmail) {
            await router.push('/login');
            return;
        }

        try {
            const response = await fetch('/api/events/reminders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventId,
                    userEmail,
                    bookingDate,
                    eventTitle: title
                }),
            });

            if (response.ok) {
                setReminderSet(true);
                toast({
                    title: "Reminder Set",
                    description: "We'll notify you when booking opens"
                });
            }
        } catch (error) {
            console.error('Failed to set reminder:', error);
            toast({
                title: "Reminder Set",
                description: "We'll notify you when booking opens"
            });
        }
    };

    // Helper function for safe date formatting
    const formatDate = (dateValue: string | Date | null) => {
        if (!dateValue) return 'Date not set';
        try {
            return format(new Date(dateValue), "MMM dd, yyyy - HH:mm");
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid date';
        }
    };

    // Helper function to format price
    const formatPrice = (value: number) => {
        return value.toFixed(2);
    };

return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto sm:w-full">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
                {/* Trailer Video - Changed to 16:9 aspect ratio */}
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                    {trailerUrl ? (
                        <ReactPlayer
                            url={trailerUrl}
                            width="100%"
                            height="100%"
                            controls
                            config={{
                                file: {
                                    attributes: {
                                        controlsList: "nodownload"
                                    }
                                }
                            }}
                        />
                    ) : (
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-contain"
                            priority
                        />
                    )}
                </div>

                {/* Event Details */}
                <div className="space-y-2">
                    <p className="text-gray-200">{description}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400">Event Date</p>
                            <p>{formatDate(date)}</p>
                        </div>
                        {!isGuestFlow && (
                            <div>
                                <p className="text-gray-400">Price</p>
                                <p className="text-green-500 font-bold">
                                    🛒 {formatPrice(price)} MYR
                                </p>
                            </div>
                        )}
                        {isCreator && (
                            <div>
                                <p className="text-gray-400">Available Tickets</p>
                                <p>{availableTickets}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-gray-400">Booking Opens</p>
                            <p>{formatDate(bookingDate)}</p>
                        </div>
                    </div>

                    {!isBookingOpen && bookingDate && (
                        <div className="bg-yellow-500/20 text-yellow-500 p-3 rounded-lg">
                            Booking will be available from {formatDate(bookingDate)}
                        </div>
                    )}

                    {soldOut && (
                        <div className="bg-red-500/20 text-red-500 p-3 rounded-lg">
                            This event tickets are sold out
                        </div>
                    )}
                </div>
            </div>

            {/* Actions section - modified to respect soldOut in all flows */}
            {showActions && (
                <div className="mt-4">
                    <BookTicketButton
                        eventId={eventId}
                        hasTicket={hasTicket}
                        isAvailable={availableTickets > 0 && !soldOut}
                        isBookingOpen={isBookingOpen}
                        userEmail={userEmail}
                        soldOut={soldOut}
                        title={title}
                        price={Number(price)}
                        onSetReminder={handleSetReminder}
                        onBookingAttempt={onBookingAttempt}
                        isGuestFlow={isGuestFlow}
                    />
                    {reminderSet && !isBookingOpen && (
                        <p className="text-xs text-green-500 mt-1">
                            ✓ Reminder set for booking opening
                        </p>
                    )}
                </div>
            )}

                {/* Add Share Button Section */}
                {canShare && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex flex-col gap-2">
                          <p className="text-sm text-gray-400">
                              {isAffiliate
                                ? "Share this event (Affiliate Link)"
                                : isCreator
                                  ? "Share this event"
                                  : "Share with friends"}
                          </p>
                          <Button
                            variant="outline"
                            onClick={handleShare}
                            className="w-full flex items-center justify-center gap-2"
                            size="sm"
                          >
                              {copied ? (
                                <span className="text-green-500 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Link Copied!
                                    </span>
                              ) : (
                                <>
                                    <Share2 className="h-4 w-4" />
                                    {isAffiliate
                                      ? "Copy Affiliate Link"
                                      : isCreator
                                        ? "Copy Event Link"
                                        : "Copy Share Link"}
                                </>
                              )}
                          </Button>
                          {isAffiliate && currentUser?.AFFCode && (
                            <p className="text-xs text-gray-500 text-center">
                                Earn commission when people book through your link
                            </p>
                          )}
                          {isCreator && (
                            <p className="text-xs text-gray-500 text-center">
                                Share your event with potential attendees
                            </p>
                          )}
                          {!isCreator && !isAffiliate && isUser && (
                            <p className="text-xs text-gray-500 text-center">
                                Share this event with your friends
                            </p>
                          )}
                      </div>
                  </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
