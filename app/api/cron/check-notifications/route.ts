// app/api/cron/check-notifications/route.ts
import { NextResponse } from 'next/server';
import prisma from "@/app/utils/db";
import { NotificationService } from '@/services/notification.service';

export const dynamic = 'force-dynamic'; // or another appropriate dynamic setting
export const runtime = 'nodejs'; // specify the runtime
export const maxDuration = 300; // optional: set max duration in seconds if needed


// Define interface for notification metadata
interface NotificationMetadata {
    eventTitle: string;
    bookingDate: string;
    eventId?: number;
    [key: string]: any; // Allow for other metadata properties
}


export async function GET() {
    try {
        const now = new Date();

        // Find all unsent notifications that are due
        const dueNotifications = await prisma.notifications.findMany({
            where: {
                type: 'event_reminder',
                created_at: {
                    lte: now
                },
                email_sent: false
            },
            include: {
                user: true // Include user to get email
            }
        });

        // Process each notification
        for (const notification of dueNotifications) {
            try {
                // Type cast the metadata
                const metadata = notification.metadata as NotificationMetadata;

                await NotificationService.sendBookingReminder({
                    userEmail: notification?.user?.email as string,
                    eventTitle: metadata.eventTitle,
                    bookingDate: new Date(metadata.bookingDate),
                    hoursUntilBooking: 1
                });

                await prisma.notifications.update({
                    where: { id: notification.id },
                    data: {
                        email_sent: true,
                        email_sent_at: new Date()
                    }
                });
            } catch (error) {
                console.error(`Failed to process notification ${notification.id}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            processedCount: dueNotifications.length
        });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'Failed to process notifications' }, { status: 500 });
    }
}
