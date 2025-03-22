import prisma from "@/app/utils/db";
import { signIn } from "next-auth/react";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {

    const { userId, password } = await req.json();

    // Convert userId string to number
    const id = parseInt(userId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { password },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}





