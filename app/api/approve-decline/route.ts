// app/api/users/route.ts
import prisma from "@/app/utils/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { id, request_approved } = await req.json();

    if (!id || request_approved === undefined) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    // Update the user record in the database
    const user = await prisma.user.update({
      where: { id: id },
      data: {
        request_approved: request_approved,
      },
    });

    // Set no-cache headers to prevent stale data
    const response = NextResponse.json({ user });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Expires', '0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
