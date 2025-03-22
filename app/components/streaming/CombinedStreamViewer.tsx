// app/components/streaming/CombinedStreamViewer.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IRemoteVideoTrack,
  IRemoteAudioTrack
} from 'agora-rtc-sdk-ng';
import { Card } from '@/components/shadcn-ui/card';
import { Webcam, Smartphone, Monitor } from 'lucide-react';
import {Alert, AlertDescription} from "@/components/shadcn-ui/alert";
import { toast } from 'sonner';

interface CombinedStreamViewerProps {
  channelName: string;
  eventId: string;
}

interface RemoteStream {
  uid: string;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
  deviceType: 'webcam' | 'mobile' | 'screen';
  layout?: string;
}

const CombinedStreamViewer = ({ channelName, eventId }: CombinedStreamViewerProps) => {
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [layout, setLayout] = useState<string>('grid');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsUserAction, setNeedsUserAction] = useState(false);
  const clientRef = useRef<IAgoraRTCClient>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const mountedRef = useRef(true);
  const streamsRef = useRef<RemoteStream[]>([]);

  // Ensure streams ref is properly typed
  type StreamsRefType = {
    current: RemoteStream[];
  };
  (streamsRef as StreamsRefType).current = streamsRef.current;

  // Add function to get or create video element
  const getVideoElement = (streamId: string, track: IRemoteVideoTrack) => {
    if (!videoElementsRef.current.has(streamId)) {
      const videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true;
      document.body.appendChild(videoElement); // Add to DOM for proper playback

      // Play the track directly in a container
      const container = document.createElement('div');
      container.id = `video-container-${streamId}`;
      container.style.display = 'none';
      document.body.appendChild(container);

      try {
        track.play(`video-container-${streamId}`);
      } catch (error) {
        console.error('Error playing track:', error);
      }

      videoElementsRef.current.set(streamId, videoElement);
    }
    return videoElementsRef.current.get(streamId)!;
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    canvas.width = 1920;
    canvas.height = 1080;
    return ctx;
  };

  const drawCombinedStream = () => {
    const ctx = setupCanvas();
    if (!ctx) return;

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const streams = streamsRef.current.filter(stream => stream.videoTrack);

    if (streams.length === 0) {
      if (mountedRef.current) {
        animationFrameRef.current = requestAnimationFrame(drawCombinedStream);
      }
      return;
    }

    if (layout === 'grid') {
      const cols = Math.ceil(Math.sqrt(streams.length));
      const rows = Math.ceil(streams.length / cols);
      const width = ctx.canvas.width / cols;
      const height = ctx.canvas.height / rows;

      streams.forEach((stream, index) => {
        if (stream.videoTrack) {
          try {
            const videoElement = getVideoElement(stream.uid, stream.videoTrack);
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = col * width;
            const y = row * height;
            ctx.drawImage(videoElement, x, y, width, height);
          } catch (error) {
            console.error('Error drawing stream:', error);
          }
        }
      });
    } else if (layout === 'spotlight') {
      const mainStream = streams.find(s => s.deviceType === 'screen') || streams[0];
      if (mainStream?.videoTrack) {
        try {
          const videoElement = getVideoElement(mainStream.uid, mainStream.videoTrack);
          ctx.drawImage(videoElement, 0, 0, ctx.canvas.width * 0.7, ctx.canvas.height);
        } catch (error) {
          console.error('Error drawing main stream:', error);
        }
      }

      const otherStreams = streams.filter(s => s !== mainStream);
      const sideWidth = ctx.canvas.width * 0.3;
      const sideHeight = ctx.canvas.height / Math.max(1, otherStreams.length);

      otherStreams.forEach((stream, index) => {
        if (stream.videoTrack) {
          try {
            const videoElement = getVideoElement(stream.uid, stream.videoTrack);
            ctx.drawImage(
              videoElement,
              ctx.canvas.width * 0.7,
              index * sideHeight,
              sideWidth,
              sideHeight
            );
          } catch (error) {
            console.error('Error drawing side stream:', error);
          }
        }
      });
    }

    if (mountedRef.current) {
      animationFrameRef.current = requestAnimationFrame(drawCombinedStream);
    }
  };

  const cleanupVideoElements = () => {
    videoElementsRef.current.forEach((video, streamId) => {
      if (video.srcObject) {
        const mediaStream = video.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
      }
      video.srcObject = null;
      video.remove(); // Remove from DOM

      // Remove container
      const container = document.getElementById(`video-container-${streamId}`);
      if (container) {
        container.remove();
      }
    });
    videoElementsRef.current.clear();
  };

  const determineDeviceType = (userId: string): 'webcam' | 'mobile' | 'screen' => {
    if (userId.includes('screen')) return 'screen';
    if (userId.includes('mobile')) return 'mobile';
    return 'webcam';
  };

  const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (!mountedRef.current || !clientRef.current) return;

    try {
      await clientRef.current.subscribe(user, mediaType);
      const userDeviceType = determineDeviceType(user.uid.toString());

      if (mediaType === 'video' && user.videoTrack) {
        // Create or get video element and setup playback
        getVideoElement(user.uid.toString(), user.videoTrack);

        setRemoteStreams(prev => {
          const newStreams = prev.filter(s => s.uid !== user.uid.toString());
          const updatedStream = {
            uid: user.uid.toString(),
            videoTrack: user.videoTrack,
            audioTrack: user.audioTrack,
            deviceType: userDeviceType
          };
          const result = [...newStreams, updatedStream];
          streamsRef.current = result;
          return result;
        });
      }

      if (mediaType === 'audio' && user.audioTrack && !needsUserAction) {
        try {
          await user.audioTrack.play();
        } catch (error) {
          console.error('Audio autoplay failed:', error);
          setNeedsUserAction(true);
        }
      }
    } catch (error) {
      console.error('Error handling published stream:', error);
    }
  };

  const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (!mountedRef.current) return;

    if (mediaType === 'video') {
      setRemoteStreams(prev => {
        const result = prev.filter(s => s.uid !== user.uid.toString());
        streamsRef.current = result;
        return result;
      });
    }
  };

  const startAudioPlayback = async () => {
    try {
      for (const stream of remoteStreams) {
        if (stream.audioTrack) {
          await stream.audioTrack.play();
        }
      }
      setNeedsUserAction(false);
    } catch (error) {
      console.error('Error starting audio playback:', error);
      toast.error('Failed to start audio. Please try again.');
    }
  };

  const initializeViewer = async () => {
    if (clientRef.current) {
      await cleanupClient();
    }

    setIsLoading(true);

    try {
      // Register autoplay failed callback
      AgoraRTC.onAutoplayFailed = () => setNeedsUserAction(true);

      clientRef.current = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8"
      });

      clientRef.current.on('user-published', handleUserPublished);
      clientRef.current.on('user-unpublished', handleUserUnpublished);
      clientRef.current.on('user-left', user => {
        handleUserUnpublished(user, 'video');
      });

      await clientRef.current.setClientRole("audience");

      // Get token and join channel
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

      await clientRef.current.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        channelName,
        token,
        null
      );

      setIsConnected(true);
      drawCombinedStream();
    } catch (error) {
      console.error('Error initializing viewer:', error);
      toast.error('Failed to connect to stream');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupClient = async () => {
    if (clientRef.current) {
      try {
        if (clientRef.current.connectionState !== 'DISCONNECTED') {
          await clientRef.current.leave();
        }

        clientRef.current.removeAllListeners();
        clientRef.current = undefined;

        streamsRef.current = [];
        setRemoteStreams([]);
        setIsConnected(false);
        setNeedsUserAction(false);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        cleanupVideoElements();
      } catch (err) {
        console.error('Error during cleanup:', err);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    initializeViewer();

    return () => {
      mountedRef.current = false;
      cleanupClient();
    };
  }, [channelName]);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const response = await fetch(`/api/streaming/${eventId}/layout`);
        if (response.ok) {
          const data = await response.json();
          setLayout(data.layout);
        }
      } catch (error) {
        console.error('Error fetching layout:', error);
      }
    };

    fetchLayout();
  }, [eventId]);

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
            ? remoteStreams.length > 0
              ? `Connected to live stream (${remoteStreams.length} active streams)`
              : 'Waiting for streamer to start'
            : 'Connecting to stream...'}
        </AlertDescription>
      </Alert>

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          {remoteStreams.map(stream => (
            <div key={stream.uid}
                 className="bg-black/60 px-2 py-1 rounded-full text-xs flex items-center gap-1">
              {stream.deviceType === 'webcam' && <Webcam className="w-4 h-4"/>}
              {stream.deviceType === 'mobile' && <Smartphone className="w-4 h-4"/>}
              {stream.deviceType === 'screen' && <Monitor className="w-4 h-4"/>}
              <span className="capitalize">{stream.deviceType}</span>
            </div>
          ))}
        </div>
        {needsUserAction && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <button
              onClick={startAudioPlayback}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg
                     font-medium shadow-lg transition-colors flex items-center gap-2"
            >
              Click to Enable Audio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedStreamViewer;
