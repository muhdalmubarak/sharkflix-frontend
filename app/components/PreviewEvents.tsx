"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatDistanceToNow, format } from 'date-fns';
import { PlayCircle } from "lucide-react";

// Add SWR for better cache management
import useSWR from 'swr';
import {useRouter} from "next/navigation";
import {TopBadge} from "@/app/components/TopBadge";
import Image from "next/image";

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  price: number;
  imageUrl: string;
  availableTickets: number;
  trailerUrl?: string;
  isTopRated: boolean,
  soldOut: boolean;
  recordingAccessCode: string | null;
  recordingUrl: string | null;
  allowRecordingAccess: boolean;
}

interface EventPreviewProps {
  event: Event;
  onClose: () => void;
  isOpen: boolean;
  onJoinEvent: () => void;
}

interface PreviewEventsProps {
  onGetStarted: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    cache: 'no-store', // Disable caching at the fetch level
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
};


const EventPreviewDialog = ({ event, isOpen, onClose, onJoinEvent }: EventPreviewProps) => {
  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "MMM dd, yyyy - HH:mm");
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#000000] border-[#121212] text-white max-w-3xl h-[80vh] overflow-y-auto">
        <DialogTitle className="text-2xl font-bold mb-4">
          {event.title}
        </DialogTitle>
        <div className={`relative w-full mb-4 ${event.trailerUrl ? 'aspect-video' : 'max-h-[70vh]'}`}>
          {event.trailerUrl ? (
            <iframe
              src={event.trailerUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex justify-center">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="max-h-[70vh] w-auto object-contain rounded-md"
              />
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-400">{formatDate(event.date)}</p>
            {/*<p className="text-[#e50914] text-xl font-bold">*/}
            {/*  🛒 {event.price.toFixed(2)} MYR*/}
            {/*</p>*/}
          </div>
          <p className="text-gray-300">{event.description}</p>
          <div className="flex justify-between items-center">
            <Button
              onClick={onJoinEvent}
              className="bg-[#e50914] hover:bg-[#f6121d] text-white"
            >
              Join Event
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PreviewEvents: React.FC<PreviewEventsProps> = ({ onGetStarted }) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  // Use SWR for data fetching with revalidation
  const { data: events, error, mutate } = useSWR<Event[]>('/api/preview-events', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true, // Refresh when tab gets focus
    revalidateOnReconnect: true // Refresh when browser regains connection
  });

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollLeft;
    const itemWidth = container.offsetWidth;
    const newIndex = Math.round(scrollPosition / itemWidth);
    setActiveIndex(newIndex);
  };
  // Force revalidate data when component mounts
  useEffect(() => {
    mutate();
  }, [mutate]);

  // Handle errors
  if (error) {
    console.error('Error loading events:', error);
    return (
      <div className="w-full px-4 md:px-8 py-8 bg-black text-white">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">Featured Events</h2>
        <p>Unable to load events. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-8 bg-black">
      <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-white">Featured Events</h2>

      <div className="relative w-full overflow-x-auto">
        <div
          className="flex space-x-4 pb-6 snap-x snap-mandatory overflow-x-auto"
          onScroll={handleScroll}
        >
          {!events ? (
            // Skeleton loading with overlapping effect
            Array.from({length: 3}).map((_, index) => (
              <div
                key={index}
                className={`flex-none w-[40%] md:w-[30%] bg-[#121212] rounded-lg overflow-hidden snap-center
                          ${index === 0 ? 'ml-0' : '-ml-4'}`}
                style={{
                  minWidth: '250px',
                  maxWidth: '300px'
                }}
              >
                <div className="aspect-[9/16] bg-[#181818] animate-pulse"/>
              </div>
            ))
          ) : (
            events.map((event, index) => (
              <div
                key={event.id}
                className={`flex-none w-[40%] md:w-[30%] bg-[#121212] rounded-lg overflow-hidden 
                          transform transition-all duration-300 hover:scale-105 snap-center group
                          ${index === 0 ? 'ml-0' : '-ml-4'}`}
                style={{
                  minWidth: '250px',
                  maxWidth: '300px'
                }}
              >
                <div className="aspect-[9/16] relative">
                  {/* Top 10 Badge */}
                  {event.isTopRated && <TopBadge />}

                  {/* Base Image */}
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
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
                      onClick={() => setSelectedEvent(event)}
                    >
                      <PlayCircle className="h-12 w-12 text-white"/>
                    </button>

                    {/* Bottom Gradient and Content */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3
                                cursor-pointer">
                      <div className="flex justify-between items-end">
                        <div className="flex-1">
                          <h3 className="text-white text-base font-semibold mb-1 line-clamp-1">
                            {event.title}
                          </h3>
                          <p className="text-gray-300 text-xs">
                            {formatEventDate(event.date)}
                          </p>
                        </div>
                        {/*<div className="flex items-center text-[#e50914] font-bold ml-2 text-sm">*/}
                        {/*  <span>{event.price.toFixed(2)} MYR</span>*/}
                        {/*</div>*/}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedEvent && (
        <EventPreviewDialog
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onJoinEvent={onGetStarted}
        />
      )}

      {/* Scroll indicators */}
      {events && events.length > 0 && (
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

export default PreviewEvents;
