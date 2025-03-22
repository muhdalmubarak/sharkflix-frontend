// app/components/streaming/CloudflareWebStream.tsx
"use client";

import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/shadcn-ui/card';
import {Monitor, Smartphone, Webcam} from 'lucide-react';

interface CloudflareWebStreamProps {
    channelName: string;
    eventId: string;
    isHost: boolean;
    event: any
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

export function CloudflareWebStream({channelName, eventId, event, isHost}: CloudflareWebStreamProps) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deviceType, setDeviceType] = useState<'webcam' | 'mobile' | 'screen'>('screen');
    const [activeDevices, setActiveDevices] = useState<Set<string>>(new Set());
    const [isInitializing, setIsInitializing] = useState(true);
    const [isClientJoined, setIsClientJoined] = useState(false);
    const [videoIframeUrl, setVideoIframeUrl] = useState('');
    const [liveStreamURLs, setLiveStreamURLs] = useState(event?.liveStreamURLs);
    const [rtmpsUrl, setRtmpsUrl] = useState('');
    const [rtmpsKey, setRtmpsKey] = useState('');
    const [rtmpsPlaybackKey, setRtmpsPlaybackKey] = useState('');
    const [streamId, setStreamId] = useState(event.streamId);
    const customerSubdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN!;

    useEffect(() => {
        setVideoIframeUrl('https://' + customerSubdomain + '/' + streamId + '/iframe');
    }, [customerSubdomain, streamId]);

    useEffect(() => {
        setRtmpsUrl(liveStreamURLs?.rtmps?.url);
        setRtmpsKey(liveStreamURLs?.rtmps?.streamKey);
        setRtmpsPlaybackKey(liveStreamURLs?.rtmpsPlayback?.streamKey);
    }, [liveStreamURLs]);

    const generateUniqueStreamId = (type: string) => {
        const timestamp = Date.now();
        return `${type}_${timestamp}`;
    };

    const handleStartStream = async (selectedDeviceType: 'webcam' | 'mobile' | 'screen') => {
        let streamData = {
            result: {
                uid: streamId,
                streamVia: 'cloudflare',
                liveStreamURLs: liveStreamURLs,
            }
        };
        setIsLoading(true);

        try {

            const systemStreamId = generateUniqueStreamId(selectedDeviceType);

            // Join channel if not already joined
            if (!isClientJoined && !streamId) {
                const response = await fetch('/api/streaming/cloudflare/stream', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        channelName,
                        role: 'publisher'
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to get streaming data');
                }

                const streamObjData = await response.json();
                streamData = streamObjData.streamData;
                if (!streamData.result.uid) {
                    throw new Error('Failed to get streaming data');
                }

            }

            setIsClientJoined(true);
            setIsStreaming(true);
            setStreamId(streamData.result.uid);
            setLiveStreamURLs(streamData.result.liveStreamURLs);
            setVideoIframeUrl('https://' + customerSubdomain + '/' + streamId + '/iframe');

            // Update state
            setActiveDevices(prev => new Set(prev).add(selectedDeviceType));

            // Register with backend
            await fetch(`/api/streaming/${eventId}/manage`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    deviceType: selectedDeviceType,
                    systemStreamId,
                    streamData
                })
            });

        } catch (error) {
            console.error('Error starting stream:', error);
            await handleStopStream(deviceType, true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStopStream = async (selectedDeviceType: 'webcam' | 'mobile' | 'screen', force = false) => {
        try {

            // Update active devices
            setActiveDevices(prev => {
                const newSet = new Set(prev);
                newSet.delete(selectedDeviceType);
                return newSet;
            });

            setVideoIframeUrl('');

            // Leave channel if this was the last device
            if (activeDevices.size === 1 && isClientJoined) {
                setIsStreaming(false);
                setIsClientJoined(false);  // Reset join status
            }

            if (!force) {
                // Update backend
                await fetch(`/api/streaming/${eventId}/manage`, {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({deviceType: selectedDeviceType})
                });
            }
        } catch (error) {
            console.error('Error stopping stream:', error);
        }
    };

    useEffect(() => {
        const checkExistingStreams = async () => {
            try {
                const response = await fetch(`/api/streaming/${eventId}/sessions`);
                if (!response.ok) return;

                const sessions = await response.json();
                const activeStreams = sessions.filter((session: any) => session.active);

                for (const session of activeStreams) {
                    await handleStartStream(session.deviceType);
                }
            } catch (error) {
                console.error('Error checking existing streams:', error);
            } finally {
                setIsInitializing(false);
            }
        };

        checkExistingStreams();

        return () => {
            // Cleanup all active streams
            Array.from(activeDevices).forEach(device => {
                handleStopStream(device as 'webcam' | 'mobile' | 'screen', true);
            });

            // Reset join status on unmount
            setIsClientJoined(false);
            setIsStreaming(false);
        };
    }, [eventId]);

    const changeLayout = async (layout: string) => {
        try {
            await fetch(`/api/streaming/${eventId}/manage`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    deviceType: deviceType,
                    layout
                })
            });
        } catch (error) {
            console.error('Error changing layout:', error);
        }
    };

    if (isInitializing) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
                    <p>Initializing streams...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* Device Selection */}
            <div className="flex gap-2">
                {['screen'].map((type) => (
                    <Button
                        key={type}
                        variant={type === deviceType ? 'default' : 'outline'}
                        onClick={() => setDeviceType(type as any)}
                        disabled={isLoading || (type !== 'screen')}
                        className="flex items-center gap-2"
                    >
                        {type === 'webcam' && <Webcam className="w-4 h-4"/>}
                        {type === 'mobile' && <Smartphone className="w-4 h-4"/>}
                        {type === 'screen' && <Monitor className="w-4 h-4"/>}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                        {activeDevices.has(type) && (
                            <span className="ml-1 text-xs">(Active)</span>
                        )}
                    </Button>
                ))}
            </div>

            {isStreaming && videoIframeUrl && (
                <div className="rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-gray-400">Use this information to send video to your input. You can use any
                            software that supports RTMPS such as OBS, FFmpeg, Wirecast and XSplit.</p>
                        <p className="text-gray-400">RTMPS URL: {rtmpsUrl}</p>
                        <p className="text-gray-400">RTMPS Key: {rtmpsKey}</p>
                        <p className="text-gray-400">RTMPS Playback Key: {rtmpsPlaybackKey}</p>
                    </div>
                </div>
            )}

            {/* Streams Grid */}
            <div className="grid grid-cols-1 gap-4">
                {/* Local Streams */}
                {['screen'].map((device) => (
                    <Card
                        key={device}
                        className={`aspect-video bg-black relative overflow-hidden ${!activeDevices.has(device) ? 'hidden' : ''}`}
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
                                id={`local-stream-${device}`}
                                className="w-full h-full"
                                style={{
                                    minHeight: '240px',
                                    aspectRatio: '16/9'
                                }}
                            />
                        )}
                        {activeDevices.has(device) && (
                            <>
                                <div
                                    className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                    {device === 'webcam' && <Webcam className="w-4 h-4"/>}
                                    {device === 'mobile' && <Smartphone className="w-4 h-4"/>}
                                    {device === 'screen' && <Monitor className="w-4 h-4"/>}
                                    Local {device}
                                </div>
                            </>
                        )}
                    </Card>
                ))}

            </div>

            {/* Stream Controls */
            }
            <div className="flex justify-center gap-4">
                <Button
                    onClick={() => {
                        if (activeDevices.has(deviceType)) {
                            handleStopStream(deviceType);
                        } else {
                            handleStartStream(deviceType);
                        }
                    }}
                    disabled={
                        isLoading ||
                        ((deviceType === 'webcam' || deviceType === 'mobile'))
                    }
                    variant={activeDevices.has(deviceType) ? "destructive" : "default"}
                    className="w-40"
                >
                    {isLoading
                        ? "Processing..."
                        : activeDevices.has(deviceType)
                            ? `Stop ${deviceType}`
                            : `Start ${deviceType}`
                    }
                </Button>
            </div>

            {/* Debug Info */
            }
            <div className="mt-4 text-sm text-gray-400">
                <p>Active Devices: {Array.from(activeDevices).join(', ') || 'None'}</p>
                <p>Current Device: {deviceType}</p>
                <p>Streaming: {isStreaming ? 'Yes' : 'No'}</p>
            </div>
        </div>
    )
        ;
}
