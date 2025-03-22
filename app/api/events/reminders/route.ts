// app/api/events/reminders/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/app/utils/db';

export async function POST(req: Request) {
    try {
        const { eventId, userEmail, bookingDate, eventTitle, userId } = await req.json();

        // Calculate notification time (5 minutes before booking opens)
        const reminderDate = new Date(bookingDate);
        reminderDate.setHours(reminderDate.getMinutes() - 5);

        // Create a scheduled notification
        await prisma.notifications.create({
            data: {
                userId: userId,
                title: "Booking Opening Soon",
                message: `Booking for "${eventTitle}" will open in 5 minutes!`,
                type: "event_reminder",
                is_read: false,
                created_at: reminderDate, // Schedule for 5 minutes before
                metadata: {
                    eventId,
                    bookingDate,
                    eventTitle,
                    reminderType: 'booking_opening'
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error setting reminder:', error);
        return NextResponse.json({ error: 'Failed to set reminder' }, { status: 500 });
    }
}
