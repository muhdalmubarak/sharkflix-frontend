// app/components/RecordingPlayer.tsx
"use client";

import {useEffect, useRef, useState} from "react";
import {Maximize, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX} from "lucide-react";
import {generateMediaUrl} from "@/lib/utils";

interface RecordingPlayerProps {
    recordingUrl: string;
    title: string;
}

export function RecordingPlayer({recordingUrl, title}: RecordingPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize player
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Set up event listeners
        const onLoadedMetadata = () => {
            setDuration(video.duration);
        };

        const onTimeUpdate = () => {
            setCurrentTime(video.currentTime);
        };

        const onEnded = () => {
            setIsPlaying(false);
        };

        // Add event listeners
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('ended', onEnded);

        // Cleanup
        return () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('ended', onEnded);
        };
    }, []);

    // Handle play/pause
    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Handle volume controls
    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isMuted) {
            video.muted = false;
            video.volume = volume;
        } else {
            video.muted = true;
        }
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const newVolume = parseFloat(e.target.value);
        video.volume = newVolume;
        setVolume(newVolume);

        if (newVolume === 0) {
            video.muted = true;
            setIsMuted(true);
        } else if (isMuted) {
            video.muted = false;
            setIsMuted(false);
        }
    };

    // Handle seek
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const newTime = parseFloat(e.target.value);
        video.currentTime = newTime;
        setCurrentTime(newTime);
    };

    // Format time (seconds -> mm:ss)
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Handle fullscreen
    const toggleFullscreen = () => {
        const player = playerRef.current;
        if (!player) return;

        if (!isFullscreen) {
            if (player.requestFullscreen) {
                player.requestFullscreen();
            } else if ((player as any).webkitRequestFullscreen) {
                (player as any).webkitRequestFullscreen();
            } else if ((player as any).mozRequestFullScreen) {
                (player as any).mozRequestFullScreen();
            } else if ((player as any).msRequestFullscreen) {
                (player as any).msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
                (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }
        }
    };

    // Update fullscreen state
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(
                document.fullscreenElement !== null ||
                (document as any).webkitFullscreenElement !== null ||
                (document as any).mozFullScreenElement !== null ||
                (document as any).msFullscreenElement !== null
            );
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    // Handle controls visibility
    const handleMouseMove = () => {
        setShowControls(true);

        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }

        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    // Skip forward/backward
    const skipForward = () => {
        const video = videoRef.current;
        if (!video) return;

        video.currentTime = Math.min(video.currentTime + 10, video.duration);
    };

    const skipBackward = () => {
        const video = videoRef.current;
        if (!video) return;

        video.currentTime = Math.max(video.currentTime - 10, 0);
    };

    return (
        <div
            ref={playerRef}
            className="relative w-full bg-black rounded-lg overflow-hidden max-w-5xl mx-auto aspect-video"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={generateMediaUrl(recordingUrl)}
                className="w-full h-full"
                onClick={togglePlay}
                playsInline
            />

            {/* Title Overlay (shown briefly when starting) */}
            {isPlaying && currentTime < 5 && (
                <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <h2 className="text-white text-lg font-semibold">{title}</h2>
                </div>
            )}

            {/* Play/Pause Overlay Button */}
            {!isPlaying && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                    onClick={togglePlay}
                >
                    <div className="bg-white/20 rounded-full p-6">
                        <Play size={40} className="text-white"/>
                    </div>
                    <div className="absolute top-4 left-4">
                        <h2 className="text-white text-lg font-semibold">{title}</h2>
                    </div>
                </div>
            )}

            {/* Controls Bar (hidden when playing unless mouse is over player) */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
                    showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
                {/* Progress Bar */}
                <div className="w-full mb-2 flex items-center">
                    <span className="text-white text-sm mr-2">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, white ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%)`,
                        }}
                    />
                    <span className="text-white text-sm ml-2">{formatTime(duration)}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {/* Play/Pause Button */}
                        <button
                            onClick={togglePlay}
                            className="text-white hover:text-blue-400 transition-colors"
                        >
                            {isPlaying ? <Pause size={24}/> : <Play size={24}/>}
                        </button>

                        {/* Skip Backward */}
                        <button
                            onClick={skipBackward}
                            className="text-white hover:text-blue-400 transition-colors"
                        >
                            <SkipBack size={20}/>
                        </button>

                        {/* Skip Forward */}
                        <button
                            onClick={skipForward}
                            className="text-white hover:text-blue-400 transition-colors"
                        >
                            <SkipForward size={20}/>
                        </button>

                        {/* Volume Controls */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={toggleMute}
                                className="text-white hover:text-blue-400 transition-colors"
                            >
                                {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Fullscreen Button */}
                    <button
                        onClick={toggleFullscreen}
                        className="text-white hover:text-blue-400 transition-colors"
                    >
                        <Maximize size={20}/>
                    </button>
                </div>
            </div>
        </div>
    );
}
