// app/components/WaitingRoom.tsx
interface WaitingRoomProps {
    eventDate: Date;
    description: string;
}

export function WaitingRoom({ eventDate, description }: WaitingRoomProps) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">Event Starting Soon</h2>
            <p className="text-gray-400 max-w-lg">
                {description}
            </p>
            <p className="text-sm text-gray-400">
                Scheduled for {eventDate.toLocaleString()}
            </p>
        </div>
    );
}
