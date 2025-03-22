// app/api/notifications/mark-read/[notificationId]/route.ts
import prisma from "@/app/utils/db";

export async function POST(
    request: Request,
    { params }: { params: { notificationId: string } }
) {
    try {
        await prisma.notifications.update({
            where: {
                id: parseInt(params.notificationId)
            },
            data: {
                is_read: true
            }
        });

        return new Response("Notification marked as read", { status: 200 });
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return new Response("Failed to mark notification as read", { status: 500 });
    }
}
