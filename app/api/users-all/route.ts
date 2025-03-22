// app/api/users/route.ts
import prisma from "@/app/utils/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Fetch users with a role of 'creator' and order by request_approved in descending order
    const users = await prisma.user.findMany({
      where: {
        role: 'creator', // Filter by role 'creator'
        // Add more conditions here if needed (e.g., active: true)
      },
      orderBy: {
        request_approved: 'desc',
      },
    });

    // Return the result with no-cache headers to ensure the latest data is fetched
    const response = NextResponse.json(users);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Expires', '0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error) {
    console.error("Error while fetching users:", error);
    return NextResponse.json(
      { error: "Failed to retrieve users. Please try again later." },
      { status: 500 }
    );
  }
}
