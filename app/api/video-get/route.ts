import prisma from "@/app/utils/db";
import {NextResponse} from "next/server";

export async function POST(req: Request) {
    try {
        const {movieId} = await req.json();


        const movie = await prisma.movie.findFirst({
            where: {id: movieId},
        });

        return NextResponse.json(movie);
    } catch (error) {
        console.error("Error geting videos:", error);
        return NextResponse.json({error: "Failed to get video"}, {status: 500});
    }
}