// app/api/events/route.ts
import {NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/utils/auth";
import prisma from "@/app/utils/db";

export async function POST(request: Request) {
    //try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new Response("Unauthorized", {status: 401});
        }

        const data = await request.json();

        const event = await prisma.events.create({
            data: {
                ...data,
                date: new Date(data.date), // Convert to Date object
                userId: session.user?.id,
            },
        });

        return NextResponse.json(event);
    // } catch (error) {
    //     console.error("Error creating event:", error);
    //     return new Response("Error creating event", {status: 500});
    // }
}
