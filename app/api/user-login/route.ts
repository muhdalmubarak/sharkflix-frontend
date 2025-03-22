import prisma from "@/app/utils/db";
import { signIn } from "next-auth/react";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();


    const user:any = await prisma.user.findFirst({
        where: { email },
      });


    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}





  