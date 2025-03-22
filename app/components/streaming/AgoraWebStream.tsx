// app/components/streaming/AgoraWebStream.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
    IAgoraRTCClient,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    ILocalVideoTrack,
    ILocalAudioTrack,
    IAgoraRTCRemoteUser,
    IRemoteVideoTrack,
    IRemoteAudioTrack,
    UID
} from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/shadcn-ui/alert';
import { Card } from '@/components/shadcn-ui/card';
import {Webcam, Smartphone, Monitor, Minimize2, Maximize2} from 'lucide-react';
import {Label} from "@/components/shadcn-ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/shadcn-ui/select";

interface AgoraWebStreamProps {
    channelName: string;
    eventId: string;
    isHost: boolean;
}

type LocalTracksType = {
    audioTrack: ILocalAudioTrack | null;
    videoTrack: ILocalVideoTrack | null;
};

interface RemoteUser extends IAgoraRTCRemoteUser {
    videoTrack?: IRemoteVideoTrack;
    audioTrack?: IRemoteAudioTrack;
    deviceType?: 'webcam' | 'mobile' | 'screen';
}

interface CameraDevice {
    deviceId: string;
    label: string;
    facing: 'user' | 'environment' | 'unknown';
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

// First, update the MobileStreamControls interface
interface MobileStreamControlsProps {
    videoTrack: ILocalVideoTrack | null;  // Change this from ICameraVideoTrack
    onCameraSwitch: (deviceId: string) => Promise<void>;
    onLayoutChange: (layout: string) => void;
    selectedRatio: AspectRatioConfig;
    onRatioChange: (ratio: AspectRatioConfig) => void;
}

// Add this component before the main AgoraWebStream component
const MobileStreamControls = ({ selectedRatio, onRatioChange, ...props }: MobileStreamControlsProps) => {
    const [cameras, setCameras] = useState<CameraDevice[]>([]);
    const [currentCamera, setCurrentCamera] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getCameras = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices
                .filter(device => device.kind === 'videoinput')
                .map(device => {
                    // Determine facing mode with proper type assertion
                    let facing: 'user' | 'environment' | 'unknown' = 'unknown';
                    const label = device.label.toLowerCase();

                    if (label.includes('back')) {
                        facing = 'environment';
                    } else if (label.includes('front')) {
                        facing = 'user';
                    }

                    return {
                        deviceId: device.deviceId,
                        label: device.label || `Camera ${device.deviceId.slice(0, 4)}`,
                        facing
                    } as CameraDevice; // Explicitly type the returned object
                });
                setCameras(videoDevices);
                if (videoDevices.length > 0 && !currentCamera) {
                    setCurrentCamera(videoDevices[0].deviceId);
                }
            } catch (error) {
                console.error('Error getting cameras:', error);
            }
        };

        getCameras();
    }, []);

    const handleCameraSwitch = async (deviceId: string) => {
        setLoading(true);
        try {
            await props.onCameraSwitch(deviceId);
            setCurrentCamera(deviceId);
        } catch (error) {
            console.error('Error switching camera:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="space-y-4 bg-black/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
              <Label>Camera Selection</Label>
              <Select
                value={currentCamera}
                onValueChange={handleCameraSwitch}
                disabled={loading}
              >
                  <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Camera"/>
                  </SelectTrigger>
                  <SelectContent>
                      {cameras.map(camera => (
                        <SelectItem key={camera.deviceId} value={camera.deviceId}>
                            {camera.label} ({camera.facing})
                        </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>

          <div className="flex items-center justify-between">
              <Label>Stream Layout</Label>
              <Select onValueChange={props.onLayoutChange}>
                  <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Layout"/>
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="grid">Grid View</SelectItem>
                      <SelectItem value="spotlight">Spotlight View</SelectItem>
                      <SelectItem value="sideBySide">Side by Side</SelectItem>
                  </SelectContent>
              </Select>
          </div>

          <div className="flex items-center justify-between">
              <Label>Aspect Ratio</Label>
              <Select
                value={selectedRatio.id}
                onValueChange={(id) => onRatioChange(ASPECT_RATIOS.find(r => r.id === id)!)}
              >
                  <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Aspect Ratio"/>
                  </SelectTrigger>
                  <SelectContent>
                      {ASPECT_RATIOS.map(ratio => (
                        <SelectItem key={ratio.id} value={ratio.id}>
                            {ratio.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
      </div>
    );
};

export function AgoraWebStream({channelName, eventId, isHost}: AgoraWebStreamProps) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deviceType, setDeviceType] = useState<'webcam' | 'mobile' | 'screen'>('mobile');
    const [activeDevices, setActiveDevices] = useState<Set<string>>(new Set());
    const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
    const [isInitializing, setIsInitializing] = useState(true);
    const clientRef = useRef<IAgoraRTCClient>();
    const tracksRef = useRef<Map<string, LocalTracksType>>(new Map());
    const [hasPermissions, setHasPermissions] = useState<boolean>(false);
    const [isClientJoined, setIsClientJoined] = useState(false);
    const [selectedRatio, setSelectedRatio] = useState<AspectRatioConfig>(ASPECT_RATIOS[0]);
    const [streamFullscreen, setStreamFullscreen] = useState<string | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            clientRef.current = AgoraRTC.createClient({
                mode: "live",
                codec: "vp8"
            });
            setupEventHandlers();
        }
    }, []);

    const setupEventHandlers = () => {
        if (!clientRef.current) return;

        clientRef.current.on('user-published', async (user, mediaType) => {
            await clientRef.current?.subscribe(user, mediaType);

            if (mediaType === 'video') {
                // Extract device type from user ID or metadata
                const deviceType = user.uid.toString().includes('mobile')
                    ? 'mobile'
                    : user.uid.toString().includes('screen')
                        ? 'screen'
                        : 'webcam';

                setRemoteUsers(prev => {
                    const exists = prev.find(u => u.uid === user.uid);
                    if (exists) {
                        return prev.map(u => u.uid === user.uid
                            ? { ...u, videoTrack: user.videoTrack, deviceType }
                            : u
                        );
                    }
                    return [...prev, { ...user, videoTrack: user.videoTrack, deviceType }];
                });

                const playerContainer = document.getElementById(`remote-stream-${user.uid}`);
                if (playerContainer && user.videoTrack) {
                    user.videoTrack.play(playerContainer);
                }
            }

            if (mediaType === 'audio' && user.audioTrack) {
                user.audioTrack.play();
            }
        });

        clientRef.current.on('user-unpublished', (user) => {
            setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });
    };

    const toggleStreamFullscreen = async (deviceId: string) => {
        const container = document.getElementById(`local-stream-${deviceId}`);
        if (!container) return;

        try {
            if (!document.fullscreenElement) {
                await container.requestFullscreen();
                setStreamFullscreen(deviceId);

                if ('orientation' in screen && window.screen.orientation) {
                    const tracks = tracksRef.current.get(deviceId);
                    if (tracks?.videoTrack) {
                        const trackSettings = tracks.videoTrack.getMediaStreamTrack().getSettings();
                        const orientation = (trackSettings.width || 0) > (trackSettings.height || 0) ?
                          'landscape' : 'portrait';
                        try {
                            await (screen.orientation as any).lock(orientation);
                        } catch (err) {
                            console.warn('Orientation lock not supported');
                        }
                    }
                }
            } else {
                await document.exitFullscreen();
                setStreamFullscreen(null);
                if ('orientation' in screen) {
                    try {
                        await (screen.orientation as any).unlock();
                    } catch (err) {
                        console.warn('Orientation unlock not supported');
                    }
                }
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    };

    const generateUniqueStreamId = (type: string) => {
        const timestamp = Date.now();
        return `${type}_${timestamp}`;
    };

    // Add this helper function at the component level
    const waitForContainer = async (containerId: string, maxAttempts = 5): Promise<HTMLElement | null> => {
        let attempts = 0;
        while (attempts < maxAttempts) {
            const container = document.getElementById(containerId);
            if (container) return container;
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms between attempts
            attempts++;
        }
        return null;
    };

    const createTracks = async (selectedDeviceType: 'screen' | 'mobile' | 'webcam') => {
        // Create tracks based on device type
        const tracks: LocalTracksType = {
            audioTrack: null,
            videoTrack: null
        };

        const videoConfig = {
            webcam: {
                width: selectedRatio.width,
                height: selectedRatio.height,
                frameRate: 30,
                bitrateMin: 1000,
                bitrateMax: 2500
            },
            mobile: {
                width: selectedRatio.width,
                height: selectedRatio.height,
                frameRate: 30,
                bitrateMin: 1000,
                bitrateMax: 2500,
                optimizationMode: "detail"
            }
        };

        if (selectedDeviceType === 'screen') {
            try {
                const screenTrack = await AgoraRTC.createScreenVideoTrack(
                  { encoderConfig: "1080p_1" },
                  "auto"
                );

                // Handle screen share track(s)
                if (Array.isArray(screenTrack)) {
                    tracks.videoTrack = screenTrack[0];
                    if (!isStreaming) {
                        tracks.audioTrack = screenTrack[1];
                    }
                } else {
                    tracks.videoTrack = screenTrack;
                    // If screen share doesn't include audio, create a microphone track
                    if (!isStreaming) {
                        tracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                            encoderConfig: {
                                sampleRate: 48000,
                                stereo: true,
                                bitrate: 128
                            }
                        });
                    }
                }
            } catch (screenError: any) {
                // Handle case where user denies screen share
                if (screenError.name === 'NotAllowedError') {
                    throw new Error('Screen sharing permission denied');
                }
                throw screenError;
            }
        } else {
            // Same settings for both webcam and mobile for now
            tracks.videoTrack = await AgoraRTC.createCameraVideoTrack({
                encoderConfig: videoConfig[selectedDeviceType],
                facingMode: "user",
            });

            if (!isStreaming) {
                tracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                    encoderConfig: {
                        sampleRate: 48000,
                        stereo: true,
                        bitrate: 128
                    }
                });
            }
        }
        // Log video track details
        console.log('Video track created:', {
            trackId: tracks.videoTrack?.getTrackId(),
            enabled: tracks.videoTrack?.enabled,
            muted: tracks.videoTrack?.muted
        });

        return tracks;
    }
    // Add this function to check permissions
    const checkMediaPermissions = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasPermissions = devices.some(device => device.label);

            if (hasPermissions) {
                setHasCameraPermission(true);
                setHasPermissions(true);
                return true;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            stream.getTracks().forEach(track => track.stop());
            setHasCameraPermission(true);
            setHasPermissions(true);
            return true;
        } catch (error) {
            console.error('Permission error:', error);
            return false;
        }
    };

    const handleStartStream = async (selectedDeviceType: 'webcam' | 'mobile' | 'screen') => {
        if (!clientRef.current) return;
        setIsLoading(true);

        try {
            // Check permissions first
            if (selectedDeviceType !== 'screen' && !hasCameraPermission) {
                const hasAccess = await checkMediaPermissions();
                if (!hasAccess) {
                    setIsLoading(false);
                    return;
                }
            }

            const streamId = generateUniqueStreamId(selectedDeviceType);

            // Join channel if not already joined
            if (!isClientJoined) {
                const tokenResponse = await fetch('/api/streaming/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channelName,
                        role: 'publisher'
                    })
                });

                if (!tokenResponse.ok) {
                    throw new Error('Failed to get streaming token');
                }
                const { token } = await tokenResponse.json();

                await clientRef.current.setClientRole('host');
                await clientRef.current.join(
                  process.env.NEXT_PUBLIC_AGORA_APP_ID!,
                  channelName,
                  token,
                  streamId
                );
                setIsClientJoined(true);
                setIsStreaming(true);
            }

            // Create and publish tracks
            const tracks = await createTracks(selectedDeviceType);
            // Store tracks reference
            tracksRef.current.set(selectedDeviceType, tracks);

            // Publish tracks only if client is joined
            if (tracks.videoTrack) {
                await clientRef.current.publish(tracks.videoTrack);

                const container = await waitForContainer(`local-stream-${selectedDeviceType}`);
                if (container) {
                    await tracks.videoTrack.play(container, {
                        fit: 'cover',
                        mirror: selectedDeviceType === 'webcam'
                    });
                }
            }

            if (tracks.audioTrack) {
                await clientRef.current.publish(tracks.audioTrack);
            }

            try {
                // Play local video with retries
                const playLocalVideo = async () => {
                    const containerPromise = waitForContainer(`local-stream-${selectedDeviceType}`);
                    const container = await containerPromise;

                    if (!container) {
                        console.error('Failed to find video container after retries');
                        return;
                    }

                    if (tracks.videoTrack) {
                        try {
                            console.log('Playing video in container:', container);
                            await tracks.videoTrack.play(container, {
                                fit: 'cover',
                                mirror: selectedDeviceType === 'webcam'
                            });
                            console.log('Successfully playing video track');
                        } catch (playError) {
                            console.error('Error playing video:', playError);
                        }
                    }
                };

                if (tracks.videoTrack) {
                    await clientRef.current.publish(tracks.videoTrack);
                    await playLocalVideo();
                }
                if (tracks.audioTrack) {
                    await clientRef.current.publish(tracks.audioTrack);
                }

            } catch (playError) {
                console.error('Error playing local video:', playError);
            }

            // Update state
            setActiveDevices(prev => new Set(prev).add(selectedDeviceType));

            // Register with backend
            await fetch(`/api/streaming/${eventId}/manage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceType: selectedDeviceType,
                    streamId
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
        const tracks = tracksRef.current.get(selectedDeviceType);
        if (!tracks || !clientRef.current) return;

        try {
            // Only attempt to unpublish if client is joined
            if (isClientJoined) {
                if (tracks.videoTrack) {
                    await clientRef.current.unpublish(tracks.videoTrack);
                    tracks.videoTrack.stop();
                    tracks.videoTrack.close();
                }

                if (activeDevices.size === 1 && tracks.audioTrack) {
                    await clientRef.current.unpublish(tracks.audioTrack);
                    tracks.audioTrack.stop();
                    tracks.audioTrack.close();
                }
            }

            // Remove from tracks reference
            tracksRef.current.delete(selectedDeviceType);

            // Update active devices
            setActiveDevices(prev => {
                const newSet = new Set(prev);
                newSet.delete(selectedDeviceType);
                return newSet;
            });

            // Leave channel if this was the last device
            if (activeDevices.size === 1 && isClientJoined) {
                await clientRef.current.leave();
                setIsStreaming(false);
                setIsClientJoined(false);  // Reset join status
            }

            if (!force) {
                // Update backend
                await fetch(`/api/streaming/${eventId}/manage`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceType: selectedDeviceType })
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

    useEffect(() => {
        checkMediaPermissions();
    }, []);

    const switchCamera = async (deviceId: string) => {
        if (!clientRef.current) return;
        const tracks = tracksRef.current.get('mobile');
        if (!tracks?.videoTrack) return;

        try {
            // First unpublish the existing track
            await clientRef.current.unpublish(tracks.videoTrack);

            // Stop and close the old track
            tracks.videoTrack.stop();
            tracks.videoTrack.close();

            // Create new video track with the selected device
            const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
                encoderConfig: {
                    width: 1920,
                    height: 1080,
                    frameRate: 30,
                    bitrateMin: 1000,
                    bitrateMax: 2500
                },
                cameraId: deviceId
            });

            // Update tracks reference
            tracksRef.current.set('mobile', {
                ...tracks,
                videoTrack: newVideoTrack
            });

            // Publish the new track
            await clientRef.current.publish(newVideoTrack);

            // Play the new track in the container
            const container = document.getElementById(`local-stream-mobile`);
            if (container) {
                await newVideoTrack.play(container, {
                    fit: 'cover',
                    mirror: false
                });
            }

        } catch (error) {
            console.error('Error switching camera:', error);
            throw error;
        }
    };

    const changeLayout = async (layout: string) => {
        try {
            await fetch(`/api/streaming/${eventId}/manage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            <Alert>
                <AlertDescription>
                    {!hasPermissions ? (
                        <div className="flex items-center gap-2">
                            <span>Camera and microphone access required.</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={checkMediaPermissions}
                            >
                                Grant Access
                            </Button>
                        </div>
                    ) : isStreaming ? (
                        'You are live streaming. You can stream from multiple devices simultaneously.'
                    ) : (
                        'Choose your device type and start streaming.'
                    )}
                </AlertDescription>
            </Alert>

            {/* Add MobileStreamControls when device type is mobile */}
            {deviceType === 'mobile' && (
              <MobileStreamControls
                videoTrack={tracksRef.current.get('mobile')?.videoTrack || null}
                onCameraSwitch={switchCamera}
                onLayoutChange={changeLayout}
                selectedRatio={selectedRatio}
                onRatioChange={(ratio) => {
                    setSelectedRatio(ratio);
                    // Recreate video track with new ratio if already streaming
                    if (tracksRef.current.get('mobile')?.videoTrack) {
                        handleStopStream('mobile');
                        handleStartStream('mobile');
                    }
                }}
              />
            )}

            {/* Device Selection */}
            <div className="flex gap-2">
                {['webcam', 'mobile', 'screen'].map((type) => (
                    <Button
                        key={type}
                        variant={type === deviceType ? 'default' : 'outline'}
                        onClick={() => setDeviceType(type as any)}
                        disabled={isLoading || (!hasPermissions && type !== 'screen')}
                        className="flex items-center gap-2"
                    >
                        {type === 'webcam' && <Webcam className="w-4 h-4" />}
                        {type === 'mobile' && <Smartphone className="w-4 h-4" />}
                        {type === 'screen' && <Monitor className="w-4 h-4" />}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                        {activeDevices.has(type) && (
                            <span className="ml-1 text-xs">(Active)</span>
                        )}
                    </Button>
                ))}
            </div>

            {/* Streams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Local Streams */}
                {['webcam', 'mobile', 'screen'].map((device) => (
                  <Card
                    key={device}
                    className={`aspect-video bg-black relative overflow-hidden ${!activeDevices.has(device) ? 'hidden' : ''}`}
                  >
                      <div
                        id={`local-stream-${device}`}
                        className="w-full h-full"
                        style={{
                            minHeight: '240px',
                            aspectRatio: selectedRatio.value
                        }}
                      />
                      {activeDevices.has(device) && (
                        <>
                            <div
                              className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                {device === 'webcam' && <Webcam className="w-4 h-4"/>}
                                {device === 'mobile' && <Smartphone className="w-4 h-4"/>}
                                {device === 'screen' && <Monitor className="w-4 h-4"/>}
                                Local {device}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="bg-black/60 hover:bg-black/80"
                              onClick={() => toggleStreamFullscreen(device)}
                            >
                                {streamFullscreen === device ? (
                                  <Minimize2 className="h-4 w-4"/>
                                ) : (
                                  <Maximize2 className="h-4 w-4"/>
                                )}
                            </Button>
                        </>
                      )}
                  </Card>
                ))}

                {/* Remote Streams */}
                {remoteUsers.map((user) => (
                  <Card key={user.uid} className="aspect-video bg-black relative overflow-hidden">
                      <div id={`remote-stream-${user.uid}`} className="w-full h-full"/>
                      <div
                        className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          {user.deviceType === 'webcam' && <Webcam className="w-4 h-4"/>}
                          {user.deviceType === 'mobile' && <Smartphone className="w-4 h-4"/>}
                          {user.deviceType === 'screen' && <Monitor className="w-4 h-4"/>}
                          Remote {user.deviceType}
                      </div>
                  </Card>
                ))}
            </div>

            {/* Stream Controls */}
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
                      (!hasPermissions && (deviceType === 'webcam' || deviceType === 'mobile'))
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

            {/* Debug Info */}
            <div className="mt-4 text-sm text-gray-400">
                <p>Active Devices: {Array.from(activeDevices).join(', ') || 'None'}</p>
                <p>Current Device: {deviceType}</p>
                <p>Streaming: {isStreaming ? 'Yes' : 'No'}</p>
            </div>
        </div>
    );
}
