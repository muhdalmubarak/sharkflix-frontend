// app/components/streaming/StreamSection.tsx
"use client";

import dynamic from 'next/dynamic';
import {WaitingRoom} from "@/app/components/WaitingRoom";
import type {AgoraStreamViewerProps} from './AgoraStreamViewer';
import {CloudflareStreamViewerProps} from "@/app/components/streaming/CloudflareStreamViewer";

// Dynamically import AgoraViewer with no SSR
const AgoraViewer = dynamic<AgoraStreamViewerProps>(
    () => import('./AgoraStreamViewer').then(mod => mod.AgoraStreamViewer),
    {ssr: false}
);

const CloudflareStreamViewer = dynamic<CloudflareStreamViewerProps>(
    () => import('./CloudflareStreamViewer').then(mod => mod.CloudflareStreamViewer),
    {ssr: false}
);

// Dynamically import CombinedStreamViewer with no SSR
const CombinedStreamViewer = dynamic<CombinedStreamViewerProps>(
    () => import('./CombinedStreamViewer').then(mod => mod.default),
    {ssr: false}
);

// Define props interface for the CombinedStreamViewer
interface CombinedStreamViewerProps {
    channelName: string;
    eventId: string;
}

interface StreamSectionProps {
    isLive: boolean;
    showWaitingRoom: boolean;
    eventDate: Date;
    description: string;
    agoraChannel: string;
    eventId: string;
    event: any
}

export function StreamSection({
                                  isLive,
                                  showWaitingRoom,
                                  eventDate,
                                  description,
                                  agoraChannel,
                                  eventId,
                                  event
                              }: StreamSectionProps) {
    return (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/20">
            {isLive ? (
                // <CombinedStreamViewer
                //     channelName={agoraChannel}
                //     eventId={eventId}
                // />
                <CloudflareStreamViewer
                    channelName={agoraChannel}
                    eventId={eventId}
                    event={event}
                />
                // <AgoraViewer
                //     channelName={agoraChannel}
                //     eventId={eventId}
                // />
            ) : showWaitingRoom ? (
                <WaitingRoom
                    eventDate={eventDate}
                    description={description}
                />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">Stream has ended</p>
                </div>
            )}
        </div>
    );
}
