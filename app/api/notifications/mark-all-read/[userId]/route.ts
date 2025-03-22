// app/api/notifications/mark-all-read/[userId]/route.ts
import prisma from "@/app/utils/db";

export async function POST(
    request: Request,
    { params }: { params: { userId: number } }
) {
    try {
        await prisma.notifications.updateMany({
            where: {
                userId: params.userId,
                is_read: false
            },
            data: {
                is_read: true
            }
        });

        return new Response("All notifications marked as read", { status: 200 });
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
        return new Response("Failed to mark all notifications as read", { status: 500 });
    }
}
