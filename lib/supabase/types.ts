export interface Event {
    id: number;
    name: string;
    date: string;
    description: string | null;
    price: number;
    total_tickets: number;
    available_tickets: number;
    stream_url: string | null;
    is_live: boolean;
    created_at: string;
    updated_at: string;
    tickets: Ticket[];
    soldOut: boolean;
    recordingAccessCode: string | null;
    recordingUrl: string | null;
    allowRecordingAccess: boolean;
}

export interface Ticket {
    id: number;
    ticket_code: string;
    qr_code: string;
    purchase_date: string;
    status: 'active' | 'used' | 'cancelled';
    event_id: number;
    userId: string;
    created_at: string;
    updated_at: string;
}

export interface Payment {
    id: number;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    payment_method: string;
    transaction_id: string;
    ticket_id: number;
    created_at: string;
    updated_at: string;
}

export interface VideoData {
    id: number;
    title: string;
    imageString: string;
    views: number;
    revenue: number;
    overview: string;
    duration: number;
    release: number;
    youtubeString: string;
    price: number;
    createdAt: string;
}

export interface DashboardData {
    summary: {
        totalRevenue: number;
        paidRevenue: number;
        unpaidRevenue: number;
        bySource: {
            movie: number;
            event: number;
        };
    };
    analytics: {
        totalViews: number;
        totalVideos: number;
        revenueHistory: Array<{ date: string; amount: number }>;
        recentVideos: VideoData[];
        allVideos: VideoData[];
    };
    allRevenues: any[]; // Define specific type if needed
    recentTransactions: any[]; // Define specific type if needed
}
