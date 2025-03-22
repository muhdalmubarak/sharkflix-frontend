// app/components/CountdownTimer.tsx
"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
    targetDate: Date;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(getTimeLeft());

    function getTimeLeft() {
        const total = targetDate.getTime() - Date.now();
        const days = Math.floor(total / (1000 * 60 * 60 * 24));
        const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((total % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds, total };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const left = getTimeLeft();
            setTimeLeft(left);

            if (left.total <= 0) {
                clearInterval(timer);
                window.location.reload(); // Refresh when countdown ends
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (timeLeft.total <= 0) {
        return null;
    }

    return (
        <div className="bg-black/20 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-2">Event starts in</p>
            <div className="grid grid-cols-4 gap-2">
                <TimeUnit value={timeLeft.days} label="Days" />
                <TimeUnit value={timeLeft.hours} label="Hours" />
                <TimeUnit value={timeLeft.minutes} label="Minutes" />
                <TimeUnit value={timeLeft.seconds} label="Seconds" />
            </div>
        </div>
    );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-xs text-gray-400">{label}</span>
        </div>
    );
}
