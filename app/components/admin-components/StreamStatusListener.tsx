// app/components/StreamStatusListener.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface StreamStatusListenerProps {
    eventId: number;
    currentStatus: {
        isLive: boolean;
        status: string;
    };
    disabled?: boolean; // Add this prop
}

export function StreamStatusListener({ eventId, currentStatus, disabled = false }: StreamStatusListenerProps) {
    // If disabled, don't set up any listeners
    if (disabled) {
        return null;
    }

    const router = useRouter();
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 5000; // 5 seconds

    const connectEventSource = useCallback(() => {
        const eventSource = new EventSource(`/api/events/${eventId}/stream-status-sse`);
        let retryTimeout: NodeJS.Timeout;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.status &&
                    data.status !== currentStatus.status &&
                    data.timestamp !== lastUpdate) {
                    setLastUpdate(data.timestamp);
                    setRetryCount(0); // Reset retry count on successful message
                    router.refresh();
                }
            } catch (error) {
                console.error('Error parsing SSE message:', error);
            }
        };

        eventSource.onopen = () => {
            setRetryCount(0); // Reset retry count on successful connection
            console.log('SSE connection opened');
        };

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            eventSource.close();

            // Retry logic
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying connection (${retryCount + 1}/${MAX_RETRIES})...`);
                retryTimeout = setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    connectEventSource();
                }, RETRY_DELAY);
            } else {
                console.error('Max retries reached, stopping reconnection attempts');
            }
        };

        return () => {
            eventSource.close();
            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }
        };
    }, [eventId, router, currentStatus, lastUpdate, retryCount]);

    useEffect(() => {
        const cleanup = connectEventSource();
        return () => {
            cleanup();
            setRetryCount(0); // Reset retry count on unmount
        };
    }, [connectEventSource]);

    // Optional: Provide visual feedback about connection status
    useEffect(() => {
        if (retryCount > 0) {
            console.log(`Connection attempt ${retryCount}/${MAX_RETRIES}`);
        }
    }, [retryCount]);

    return null;
}
