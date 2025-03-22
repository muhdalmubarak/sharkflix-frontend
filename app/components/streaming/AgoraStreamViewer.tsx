// app/components/streaming/AgoraStreamViewer.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
    IAgoraRTCClient,
    IAgoraRTCRemoteUser,
    IRemoteVideoTrack,
    IRemoteAudioTrack,
} from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/shadcn-ui/alert';
import { Card } from '@/components/shadcn-ui/card';
import { Webcam, Smartphone, Monitor, Maximize2, Minimize2 } from 'lucide-react';


export interface AgoraStreamViewerProps {
    channelName: string;
    eventId: string;
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
    { id: '16:9', label: 'Landscape (16:9)', value: '16/9', width: 1920, height: 1080 },
    { id: '9:16', label: 'Portrait (9:16)', value: '9/16', width: 1080, height: 1920 },
    { id: '1:1', label: 'Square', value: '1/1', width: 1080, height: 1080 },
    { id: '4:3', label: 'Classic (4:3)', value: '4/3', width: 1440, height: 1080 }
];

export function AgoraStreamViewer({ channelName, eventId }: AgoraStreamViewerProps) {
    const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const clientRef = useRef<IAgoraRTCClient>();
    const [fullscreenStreamId, setFullscreenStreamId] = useState<string | null>(null);
    const [activeRatio, setActiveRatio] = useState<AspectRatioConfig>(ASPECT_RATIOS[0]);

    const initializeViewer = async () => {
        try {
            clientRef.current = AgoraRTC.createClient({
                mode: "live",
                codec: "vp8"
            });

            // Set role to audience
            await clientRef.current.setClientRole("audience");

            // Get token
            const tokenResponse = await fetch('/api/streaming/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelName,
                    role: 'audience'
                })
            });

            if (!tokenResponse.ok) {
                throw new Error('Failed to get streaming token');
            }

            const { token } = await tokenResponse.json();

            // Join channel
            await clientRef.current.join(
                process.env.NEXT_PUBLIC_AGORA_APP_ID!,
                channelName,
                token,
                null
            );

            setupEventHandlers();
            setIsConnected(true);
        } catch (error) {
            console.error('Error initializing viewer:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFullscreen = async (streamId: string) => {
        const container = document.getElementById(`remote-stream-${streamId}`);
        if (!container) return;

        try {
            if (!document.fullscreenElement) {
                await container.requestFullscreen();
                setFullscreenStreamId(streamId);

                // Handle orientation
                if ('orientation' in screen && 'type' in screen.orientation) {
                    const orientation = activeRatio.width > activeRatio.height ? 'landscape' : 'portrait';
                    try {
                        await (screen.orientation as any).lock(orientation);
                    } catch (orientationError) {
                        console.warn('Orientation lock not supported:', orientationError);
                    }
                }
            } else {
                await document.exitFullscreen();
                setFullscreenStreamId(null);
                if ('orientation' in screen) {
                    try {
                        await (screen.orientation as any).unlock();
                    } catch (orientationError) {
                        console.warn('Orientation unlock not supported:', orientationError);
                    }
                }
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    };

    const determineDeviceType = (user: IAgoraRTCRemoteUser): 'webcam' | 'mobile' | 'screen' => {
        const uid = user.uid.toString();
        if (uid.includes('screen')) return 'screen';
        if (uid.includes('mobile')) return 'mobile';
        return 'webcam';
    };

    const setupEventHandlers = () => {
        if (!clientRef.current) return;

        clientRef.current.on('user-published', async (user, mediaType) => {
            try {
                await clientRef.current?.subscribe(user, mediaType);
                console.log(`Subscribed to ${mediaType} track from user:`, user.uid);

                const deviceType = determineDeviceType(user);

                if (mediaType === 'video') {
                    setRemoteUsers(prev => {
                        // Check if user already exists
                        const existingUserIndex = prev.findIndex(u => u.uid === user.uid);

                        if (existingUserIndex !== -1) {
                            // Update existing user
                            const newUsers = [...prev];
                            newUsers[existingUserIndex] = {
                                ...prev[existingUserIndex],
                                videoTrack: user.videoTrack,
                                deviceType
                            };
                            return newUsers;
                        }

                        // Add new user
                        return [...prev, {
                            ...user,
                            videoTrack: user.videoTrack,
                            deviceType
                        }];
                    });

                    // Play video after ensuring container exists
                    setTimeout(async () => {
                        const container = document.getElementById(`remote-stream-${user.uid}`);
                        if (container && user.videoTrack) {
                            try {
                                await user.videoTrack.play(container);
                                console.log(`Successfully playing video for user ${user.uid}`);
                            } catch (playError) {
                                console.error(`Error playing video for user ${user.uid}:`, playError);
                            }
                        }
                    }, 100);
                }

                if (mediaType === 'audio' && user.audioTrack) {
                    user.audioTrack.play();
                }
            } catch (error) {
                console.error('Error subscribing to stream:', error);
            }
        });

        clientRef.current.on('user-unpublished', (user, mediaType) => {
            if (mediaType === 'video') {
                setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
            }
        });

        clientRef.current.on('user-left', (user) => {
            setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });
    };

    useEffect(() => {
        initializeViewer();
        return () => {
            if (clientRef.current) {
                remoteUsers.forEach(user => {
                    if (user.videoTrack) user.videoTrack.stop();
                    if (user.audioTrack) user.audioTrack.stop();
                });
                clientRef.current.leave().catch(console.error);
            }
        };
    }, []);

    // Modify the grid layout based on number of streams
    const getGridLayout = (streamCount: number) => {
        if (streamCount === 0) return '';
        if (streamCount === 1) return 'grid-cols-1';
        if (streamCount === 2) return 'grid-cols-1 md:grid-cols-2';
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    };

    // Sort streams to prioritize screen share
    const sortedRemoteUsers = [...remoteUsers].sort((a, b) => {
        if (a.deviceType === 'screen') return -1;
        if (b.deviceType === 'screen') return 1;
        if (a.deviceType === 'webcam') return -1;
        if (b.deviceType === 'webcam') return 1;
        return 0;
    });

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
                    ? sortedRemoteUsers.length > 0
                      ? `Connected to live stream (${sortedRemoteUsers.length} active streams)`
                      : 'Waiting for streamer to start'
                    : 'Connecting to stream...'}
              </AlertDescription>
          </Alert>

          {sortedRemoteUsers.length === 0 ? (
            <div className="aspect-video bg-black/20 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Waiting for stream to start...</p>
            </div>
          ) : (
            <div className={`grid ${getGridLayout(sortedRemoteUsers.length)} gap-4`}>
                {sortedRemoteUsers.map((user) => (
                  <Card
                    key={user.uid}
                    className={`relative overflow-hidden ${
                      user.deviceType === 'screen' ? 'md:col-span-2 lg:col-span-3' : ''
                    }`}
                    style={{
                        aspectRatio: activeRatio.value
                    }}
                  >
                      <div
                        id={`remote-stream-${user.uid}`}
                        className="w-full h-full"
                        style={{
                            objectFit: 'cover',
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          {user.deviceType === 'webcam' && <Webcam className="w-4 h-4" />}
                          {user.deviceType === 'mobile' && <Smartphone className="w-4 h-4" />}
                          {user.deviceType === 'screen' && <Monitor className="w-4 h-4" />}
                          <span className="capitalize">{user.deviceType} View</span>
                      </div>
                      {/* Fullscreen button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80"
                        onClick={() => toggleFullscreen(user.uid.toString())}
                      >
                          {fullscreenStreamId === user.uid.toString() ? (
                            <Minimize2 className="h-4 w-4" />
                          ) : (
                            <Maximize2 className="h-4 w-4" />
                          )}
                      </Button>
                  </Card>
                ))}
            </div>
          )}
      </div>
    );
}

export default AgoraStreamViewer;
