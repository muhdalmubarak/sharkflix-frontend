// app/components/creator-components/CreatorEventCard.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn-ui/card";
import { format } from "date-fns";
import {Edit, PlayCircle, Trash2} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EditEventDialog } from "./EditEventDialog";
import {useState} from "react";
import { Video } from 'lucide-react';
import {EventPreviewModal} from "@/app/components/EventPreviewModal";
import { useSession } from "next-auth/react";

interface CreatorEventCardProps {
    event: any;
    ticketsSold: number;
    revenue: number;
}

export function CreatorEventCard({ event, ticketsSold, revenue }: CreatorEventCardProps) {
    const router = useRouter();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const { data: session } = useSession();

    const eventDate = new Date(event.date);
    const bookingDate = new Date(event.bookingDate);
    const now = new Date();

    // Helper function to check if two dates are on the same day
    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    };

    // Updated status logic
    const isEventDay = isSameDay(eventDate, now);
    const isUpcoming = eventDate > now || isEventDay;
    const isPast = eventDate < now && !isEventDay;
    const isLive = event.isLive && (isUpcoming || isEventDay);

    // Updated canStream logic - can stream on the event date
    const canStream = isEventDay || (isUpcoming && isSameDay(eventDate, now));
    const isBookingOpen = now >= bookingDate;

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this event?")) {
            try {
                const response = await fetch(`/api/events/${event.id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    router.refresh();
                } else {
                    const errorData = await response.text();
                    setDeleteError(errorData);
                    // Clear error after 5 seconds
                    setTimeout(() => setDeleteError(null), 5000);
                }
            } catch (error) {
                console.error('Error deleting event:', error);
                setDeleteError('Failed to delete event');
            }
        }
    };

    const formatDateTime = (date: string | Date) => {
        return format(new Date(date), "MMM dd, yyyy - hh:mm a");
    };

    // Determine if delete should be disabled
    const hasActiveTickets = event.tickets.length > 0;
    const eventNotEnded = new Date(event.date) > new Date();
    const canDelete = !(hasActiveTickets && eventNotEnded);

    return (
        <>
            <Card className="w-full h-full flex flex-col bg-black/20 overflow-hidden">
                <CardHeader className="p-0 w-full">
                    <div className="relative w-full pt-[177.78%]"> {/* This creates 9:16 aspect ratio */}
                        <div
                          className="absolute inset-0 cursor-pointer group"
                          onClick={() => setShowPreview(true)}
                        >
                            {event.imageUrl && (
                              <Image
                                src={event.imageUrl}
                                alt={event.title}
                                fill
                                className="object-cover"
                                priority
                              />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PlayCircle className="w-12 h-12 text-white/90"/>
                            </div>
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                <span className={`text-sm px-3 py-1 rounded-full ${
                                  !isBookingOpen
                                    ? 'bg-yellow-500/20 text-yellow-500'
                                    : isLive
                                      ? 'bg-red-500/20 text-red-500'
                                      : isPast
                                        ? 'bg-gray-500/20 text-gray-500'
                                        : 'bg-green-500/20 text-green-500'
                                }`}>
                                    {!isBookingOpen
                                      ? 'Booking Soon'
                                      : isLive
                                        ? 'Live'
                                        : isPast
                                          ? 'Past'
                                          : isEventDay
                                            ? 'Today'
                                            : 'Upcoming'}
                                </span>
                                {event.isaffiliate && (
                                  <span className="px-3 py-1 bg-purple-500/90 text-white text-sm font-medium rounded-full">
                                        {event.commissionPercentage}% Affiliate
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 line-clamp-1">{event.title}</h3>
                            <div className="space-y-1 text-sm text-gray-400">
                                <p className="line-clamp-1">Event: {formatDateTime(eventDate)}</p>
                                <p className="line-clamp-1">Booking: {formatDateTime(bookingDate)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-black/20 p-2 rounded-lg">
                                <p className="text-xs text-gray-400">Price</p>
                                <p className="text-sm font-semibold">MYR {event.price.toFixed(2)}</p>
                            </div>
                            <div className="bg-black/20 p-2 rounded-lg">
                                <p className="text-xs text-gray-400">Available</p>
                                <p className="text-sm font-semibold">{event.availableTickets}</p>
                            </div>
                            <div className="bg-black/20 p-2 rounded-lg">
                                <p className="text-xs text-gray-400">Sold</p>
                                <p className="text-sm font-semibold">{ticketsSold}</p>
                            </div>
                            <div className="bg-black/20 p-2 rounded-lg">
                                <p className="text-xs text-gray-400">Revenue</p>
                                <p className="text-sm font-semibold">MYR {revenue.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white border-0 h-8"
                              onClick={() => router.push(`/creator-home/events/${event.id}`)}
                              disabled={!canStream}
                            >
                                <Video className="w-3 h-3 mr-1"/>
                                {isLive ? "Manage" : "Stream"}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white border-0 h-8"
                              onClick={() => setEditModalOpen(true)}
                            >
                                <Edit className="w-3 h-3 mr-1"/>
                                Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 bg-red-950 hover:bg-red-900 text-red-500 border-0 h-8"
                              onClick={handleDelete}
                              disabled={!canDelete}
                            >
                                <Trash2 className="w-3 h-3 mr-1"/>
                                Delete
                            </Button>
                        </div>

                        {deleteError && (
                          <div className="mt-2 p-2 bg-red-950 text-red-500 text-xs rounded">
                              {deleteError}
                          </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <EventPreviewModal
                open={showPreview}
                onOpenChange={setShowPreview}
                title={event.title}
                description={event.description}
                trailerUrl={event.trailerUrl}
                imageUrl={event.imageUrl}
                date={event.date}
                bookingDate={event.bookingDate}
                price={Number(event.price)}
                availableTickets={event.availableTickets}
                isBookingOpen={isBookingOpen}
                eventId={event.id}
                hasTicket={false}
                userEmail={null}
                showActions={false}
                currentUser={session?.user}
                soldOut={event.soldOut}
            />

            <EditEventDialog
                event={event}
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
            />
        </>
    );
}
