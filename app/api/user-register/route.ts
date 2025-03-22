import prisma from "@/app/utils/db";
import { signIn } from "next-auth/react";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {

    const { email,jobtitle,company,fullname } = await req.json();



    const user: any = await prisma.user.update({
        where: { email:email }, 
        data: {           
          name: fullname,
          job_title: jobtitle,
          company: company,
        },
      })


    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}





  