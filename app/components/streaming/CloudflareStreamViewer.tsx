// app/components/streaming/CloudflareStreamViewer.tsx
"use client";

import {useEffect, useState} from 'react';
import {IAgoraRTCRemoteUser, IRemoteAudioTrack, IRemoteVideoTrack,} from 'agora-rtc-sdk-ng';
import {Alert, AlertDescription} from '@/components/shadcn-ui/alert';
import {Card} from '@/components/shadcn-ui/card';


export interface CloudflareStreamViewerProps {
    channelName: string;
    eventId: string;
    event: any;
}

interface RemoteUser extends IAgoraRTCRemoteUser {
    videoTrack?: IRemoteVideoTrack;
    audioTrack?: IRemoteAudioTrack;
    deviceType?: 'webcam' | 'mobile' | 'screen';
}

interface AspectRatioConfig {
    id: string;
    label: string;
    value: string;
    width: number;
    height: number;
}

const ASPECT_RATIOS: AspectRatioConfig[] = [
    {id: '16:9', label: 'Landscape (16:9)', value: '16/9', width: 1920, height: 1080},
    {id: '9:16', label: 'Portrait (9:16)', value: '9/16', width: 1080, height: 1920},
    {id: '1:1', label: 'Square', value: '1/1', width: 1080, height: 1080},
    {id: '4:3', label: 'Classic (4:3)', value: '4/3', width: 1440, height: 1080}
];

export function CloudflareStreamViewer({channelName, eventId, event}: CloudflareStreamViewerProps) {
    const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [fullscreenStreamId, setFullscreenStreamId] = useState<string | null>(null);
    const [activeRatio, setActiveRatio] = useState<AspectRatioConfig>(ASPECT_RATIOS[0]);
    const [videoIframeUrl, setVideoIframeUrl] = useState('');
    const customerSubdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN!;

    useEffect(() => {
        if (event.streamId && event.isLive) {
            setIsConnected(true);
            setIsLoading(false);
            setVideoIframeUrl('https://' + customerSubdomain + '/' + event.streamId + '/iframe');
        }
    }, [customerSubdomain, event.streamId]);

    // Modify the grid layout based on number of streams
    const getGridLayout = (streamCount: number) => {
        if (streamCount === 0) return '';
        if (streamCount === 1) return 'grid-cols-1';
        if (streamCount === 2) return 'grid-cols-1 md:grid-cols-2';
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
                    <p>Connecting to stream...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Alert>
                <AlertDescription>
                    {isConnected
                        ? `Connected to live stream`
                        : 'Waiting for streamer to start'}
                </AlertDescription>
            </Alert>

            {!isConnected ? (
                <div className="aspect-video bg-black/20 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Waiting for stream to start...</p>
                </div>
            ) : (
                <div className={`grid grid-cols-1 gap-4`}>
                    <Card
                        className={`aspect-video bg-black relative overflow-hidden`}
                    >

                        {videoIframeUrl ? (
                            <>
                                <div style={{
                                    position: 'relative',
                                    paddingTop: '56.25%',
                                    height: '100%',
                                    width: '100%'
                                }}>
                                    <iframe
                                        src={`${videoIframeUrl}`}
                                        style={{
                                            border: "none",
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            height: '100%',
                                            width: '100%'
                                        }}
                                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                        allowFullScreen={true}
                                    ></iframe>
                                </div>
                            </>
                        ) : (
                            <div
                                id={`remote-stream`}
                                className="w-full h-full"
                                style={{
                                    objectFit: 'cover',
                                }}
                            />
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}

export default CloudflareStreamViewer;
