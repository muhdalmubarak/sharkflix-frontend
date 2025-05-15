"use client";

import {format} from "date-fns";
import {useEffect, useState} from "react";
import {PlayCircle} from "lucide-react";
import {EventPreviewModal} from "@/app/components/EventPreviewModal";
import Image from "next/image";
import {TopBadge} from "@/app/components/TopBadge";
import {generateMediaUrl} from "@/lib/utils";

interface EventCardProps {
    id: bigint | number;
    title: string;
    description: string;
    date: Date;
    bookingDate: Date;
    price: number;
    availableTickets: number;
    hasTicket: boolean;
    soldOut: boolean;
    userEmail: string;
    imageUrl: string; // Add this
    trailerUrl: string; // Add this
    currentUser: any;
    showActions: boolean;
    isTopRated?: boolean;
}

export function EventCard({
                              id,
                              title,
                              description,
                              date,
                              bookingDate,
                              price,
                              availableTickets,
                              hasTicket,
                              soldOut,
                              userEmail,
                              imageUrl,
                              trailerUrl,
                              currentUser,
                              showActions,
                              isTopRated,
                          }: EventCardProps) {
    const [showPreview, setShowPreview] = useState(false);
    const parsedBookingDate = bookingDate ? new Date(bookingDate) : null;
    const isBookingOpen = parsedBookingDate ? new Date() >= parsedBookingDate : false;
    const isCreator = currentUser?.role === 'creator';

    const [imageRealUrl, setImageRealUrl] = useState<string | null>(null);
    useEffect(() => {
        generateMediaUrl(imageUrl)
            .then(url => {
                setImageRealUrl(url);
            })
            .catch(err => {
                console.error('Cannot generate image URL:', err);
                setImageRealUrl(null);
            })
    }, [imageUrl])

    const formatDate = (date: Date | string | null) => {
        if (!date) return 'Date not set';
        try {
            return format(new Date(date), "MMM dd, yyyy - HH:mm");
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid date';
        }
    };

    const handlePreviewClick = () => {
        setShowPreview(true);
    };

    return (
        <div className="relative w-full aspect-[9/16]">
            {/* Top 10 Badge */}
            {isTopRated && <TopBadge/>}

            {/* Base Image */}
            <Image
                src={imageRealUrl ?? ""}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 40vw, 30vw"
                priority
            />


            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer
                    hover:scale-110 transition-transform duration-200"
                    onClick={handlePreviewClick}
                >
                    <PlayCircle className="h-12 w-12 text-white"/>
                </button>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3
                      cursor-pointer">
                    <div className="flex justify-between items-end">
                        <div className="flex-1">
                            <h3 className="text-white text-base font-semibold mb-1 line-clamp-1">
                                {title}
                            </h3>
                            <p className="text-gray-300 text-xs">
                                {formatDate(date)}
                            </p>
                            {!isBookingOpen && parsedBookingDate && (
                                <p className="text-xs text-yellow-500 mt-1">
                                    Opens {formatDate(bookingDate)}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center text-[#e50914] font-bold ml-2 text-sm">
                            <span>{Number(price).toFixed(2)} MYR</span>
                        </div>
                    </div>
                    {isCreator && (
                        <p className="text-xs text-gray-300 mt-1">
                            {availableTickets} tickets left
                        </p>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            <EventPreviewModal
                open={showPreview}
                onOpenChange={setShowPreview}
                title={title}
                description={description}
                trailerUrl={trailerUrl}
                date={date}
                bookingDate={bookingDate}
                price={Number(price)} // Convert Decimal to number
                availableTickets={availableTickets}
                isBookingOpen={isBookingOpen}
                eventId={id}
                hasTicket={hasTicket}
                userEmail={userEmail}
                imageUrl={imageUrl}
                currentUser={currentUser} // Add this line
                showActions={showActions}
                soldOut={soldOut}/>
        </div>
    );
}
