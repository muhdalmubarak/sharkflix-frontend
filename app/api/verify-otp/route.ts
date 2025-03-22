// app/api/users/route.ts
import prisma from "@/app/utils/db";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email,input_otp } = await req.json();

    // Hash the password

    const user:any = await prisma.user.findFirst({
        where: { email },
      });

      if (input_otp == user.user_otp){
        return NextResponse.json({ success:'Otp Verification Successful' }, { status: 200 });

      }else{
        return NextResponse.json({ error:'Wrong OTP' }, { status: 400 });

      }

  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}


