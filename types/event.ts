export interface Event {
    id: number;
    title: string;
    description: string;
    date: Date;
    price: number;
    totalTickets: number;
    availableTickets: number;
    imageUrl: string;
    streamUrl: string;
    isLive: boolean;
    soldOut: boolean;
    created_at: Date;
    updated_at: Date;
    userId: string;
    status: 'upcoming' | 'live' | 'ended';
    tickets: any[]; // Replace with proper Ticket type if needed
    isTopRated: boolean;
    recordingAccessCode: string | null;
    recordingUrl: string | null;
    allowRecordingAccess: boolean;
}

