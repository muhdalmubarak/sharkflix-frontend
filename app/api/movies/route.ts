// app/api/movie/route.ts
import {NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/utils/auth";
import prisma from "@/app/utils/db";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new Response("Unauthorized", {status: 401});
        }

        const data = await request.json();

        const movie = await prisma.movie.create({
            data: {
                ...data,
                userId: session.user?.id,
            },
        });

        return NextResponse.json(movie);
    } catch (error) {
        console.error("Error creating movie:", error);
        return NextResponse.json({error: "Error creating movie"}, {status: 500});
    }
}
