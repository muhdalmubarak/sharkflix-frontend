// lib/youtube.ts
export interface StreamStatus {
    isLive: boolean;
    status: 'upcoming' | 'live' | 'ending' | 'ended' | 'technical_difficulties';
    startTime: string | null;
    endTime: string | null;
    healthStatus: 'good' | 'warning' | 'error';
    viewerCount?: number;
    streamQuality?: string;
    lastChecked: string;
}

const STREAM_BUFFER_TIME = {
    PREP: 15 * 60 * 1000, // 15 minutes before start
    GRACE: 30 * 60 * 1000, // 30 minutes after scheduled end
    SESSION: 2 * 60 * 60 * 1000 // 2 hours default stream length
};

export async function checkStreamStatus(event: any): Promise<StreamStatus> {
    const now = new Date();
    const eventDate = new Date(event.date);
    const streamEndTime = new Date(eventDate.getTime() + STREAM_BUFFER_TIME.SESSION);

    // Calculate various time windows
    const preStreamWindow = new Date(eventDate.getTime() - STREAM_BUFFER_TIME.PREP);
    const graceEndTime = new Date(streamEndTime.getTime() + STREAM_BUFFER_TIME.GRACE);

    // Determine stream status
    const determineStatus = (): StreamStatus['status'] => {
        if (now < preStreamWindow) return 'upcoming';
        if (now >= preStreamWindow && now < eventDate) return 'upcoming';
        if (now >= eventDate && now < streamEndTime) {
            if (event.isLive) {
                const health = determineHealth();
                return health === 'error' ? 'technical_difficulties' : 'live';
            }
            return 'technical_difficulties';
        }
        if (now >= streamEndTime && now < graceEndTime) return 'ending';
        return 'ended';
    };

    // Determine stream health
    const determineHealth = (): StreamStatus['healthStatus'] => {
        if (!event.streamUrl) return 'error';

        // In real implementation, you'd check actual stream metrics
        const randomFactor = Math.random();
        if (randomFactor > 0.95) return 'warning'; // 5% chance of warning
        if (randomFactor > 0.99) return 'error';   // 1% chance of error
        return 'good';
    };

    // Calculate viewer count
    const calculateViewerCount = (): number => {
        if (now < eventDate || now > streamEndTime) return 0;

        const totalDuration = streamEndTime.getTime() - eventDate.getTime();
        const elapsed = now.getTime() - eventDate.getTime();
        const progress = elapsed / totalDuration;

        // Simulate a bell curve of viewers
        const baseViewers = 100;
        const peak = Math.sin(progress * Math.PI) * baseViewers;
        return Math.max(0, Math.floor(peak + (Math.random() * 20 - 10)));
    };

    // Determine stream quality
    const determineQuality = (): string => {
        const health = determineHealth();
        if (health === 'error') return '480p';
        if (health === 'warning') return '720p';
        return '1080p';
    };

    const status = determineStatus();
    const health = determineHealth();

    return {
        isLive: status === 'live',
        status,
        startTime: status !== 'upcoming' ? eventDate.toISOString() : null,
        endTime: status === 'ended' ? streamEndTime.toISOString() : null,
        healthStatus: health,
        viewerCount: calculateViewerCount(),
        streamQuality: determineQuality(),
        lastChecked: now.toISOString()
    };
}

// Update the stream check function to validate YouTube URLs
export function validateStreamUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return (
            urlObj.hostname.includes('youtube.com') ||
            urlObj.hostname.includes('youtu.be')
        );
    } catch {
        return false;
    }
}

// Extract video ID from YouTube URL
export function extractVideoId(url: string): string | null {
    if (!validateStreamUrl(url)) return null;

    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
            return urlObj.searchParams.get('v');
        } else if (urlObj.hostname.includes('youtu.be')) {
            return urlObj.pathname.slice(1);
        }
    } catch (e) {
        console.error('Error parsing YouTube URL:', e);
    }
    return null;
}
