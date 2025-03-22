'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/shadcn-ui/button";
import { EventCard } from "@/app/components/EventCard";

interface Event {
  id: number;
  title: string;
  description: string;
  date: Date;
  bookingDate: Date;
  price: number;
  imageUrl: string | null;
  trailerUrl: string | null;
  totalTickets: number;
  availableTickets: number;
  commissionPercentage: number | null;
  streamUrl: string | null;
  tickets: Array<any>;
  isTopRated: boolean;
  soldOut: boolean;
  recordingAccessCode?: string | null;
  recordingUrl?: string | null;
  allowRecordingAccess?: boolean;
}

interface CurrentUser {
  role: string | null;
  AFFCode: string | null;
  email: string | null;
  id: number;
}

interface UpcomingEventsProps {
  events: Event[];
  currentUser: CurrentUser | null;
  userEmail: string | null | undefined;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events, currentUser, userEmail }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollLeft;
    const itemWidth = container.offsetWidth;
    const newIndex = Math.round(scrollPosition / itemWidth);
    setActiveIndex(newIndex);
  };

  if (events.length === 0) {
    return (
      <div className="col-span-full text-center py-12 bg-black/20 rounded-lg">
        <p className="text-gray-400">No upcoming events available.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Featured Events</h1>

      <div className="relative w-full overflow-x-auto">
        <div
          className="flex space-x-4 pb-6 snap-x snap-mandatory overflow-x-auto"
          onScroll={handleScroll}
        >
          {events.map((event) => (
            <div
              key={event.id}
              className="flex-none w-[40%] md:w-[30%] bg-[#121212] rounded-lg overflow-hidden
                        transform transition-all duration-300 hover:scale-105 snap-center group"
              style={{
                minWidth: '250px',
                maxWidth: '300px'
              }}
            >
              <EventCard
                id={event.id}
                title={event.title}
                description={event.description}
                date={event.date}
                bookingDate={event.bookingDate}
                price={event.price}
                availableTickets={event.availableTickets}
                hasTicket={event.tickets.length > 0}
                userEmail={userEmail as string}
                imageUrl={event.imageUrl as string}
                trailerUrl={event.trailerUrl as string}
                currentUser={currentUser}
                showActions
                isTopRated={event.isTopRated}
                soldOut={event.soldOut}
              />
            </div>
          ))}
        </div>
      </div>

      {events.length > 0 && (
        <div className="flex justify-center mt-4 space-x-2">
          {events.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === activeIndex ? 'bg-[#e50914]' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;
