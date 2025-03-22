// app/api/reset-password/route.ts
import { NextResponse } from "next/server";
import { NotificationService } from "@/services/notification.service";

export async function POST(req: Request) {
  try {
    const { email, userId, eventId, refCode } = await req.json();

    await NotificationService.sendPasswordResetEmail(email, userId, eventId, refCode);

    return NextResponse.json({
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
