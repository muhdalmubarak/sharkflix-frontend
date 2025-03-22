// app/api/notifications/[userId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/utils/db";

export async function GET(
    request: Request,
    { params }: { params: { userId: number } }
) {
    try {
        const notifications = await prisma.notifications.findMany({
            where: {
                userId: parseInt(String(params.userId), 10) // Convert string to integer
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 50 // Limit to most recent 50 notifications
        });

        return NextResponse.json({notifications});
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return new Response("Failed to fetch notifications", { status: 500 });
    }
}

