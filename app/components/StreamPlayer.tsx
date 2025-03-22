// app/components/StreamPlayer.tsx
"use client";

import ReactPlayer from 'react-player';
import { useEffect, useRef, useState } from 'react';

interface StreamPlayerProps {
    streamUrl: string;
    title: string;
    token?: string;
}

export function StreamPlayer({ streamUrl, title, token }: StreamPlayerProps) {
    const playerRef = useRef<ReactPlayer>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Verify stream authorization
        const verifyAccess = async () => {
            try {
                const response = await fetch('/api/stream/verify-access', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ streamUrl }),
                });

                if (response.ok) {
                    setIsAuthorized(true);
                }
            } catch (error) {
                console.error('Error verifying stream access:', error);
            }
        };

        verifyAccess();
    }, [streamUrl]);

    if (!isAuthorized) {
        return (
          <div className="aspect-video bg-black/90 flex items-center justify-center">
              <p className="text-white">Verifying stream access...</p>
          </div>
        );
    }

    return (
      <div className="relative w-full aspect-video">
          <ReactPlayer
            ref={playerRef}
            url={`/api/stream/proxy/${encodeURIComponent(streamUrl)}`}
            playing={false}
            controls={true}
            width="100%"
            height="100%"
            config={{
                file: {
                    forceHLS: true,
                    hlsOptions: {
                        maxLoadingDelay: 4,
                        maxBufferLength: 30,
                        maxMaxBufferLength: 600,
                        lowLatencyMode: true,
                        debug: false,
                    }
                }
            }}
          />
      </div>
    );
}
