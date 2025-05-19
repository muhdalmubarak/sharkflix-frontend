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
        const {fileSize} = data;
        delete data.fileSize;

        const movie = await prisma.movie.create({
            data: {
                ...data,
                user: {
                    connect: {
                      id: Number(session.user?.id),
                    },
                },
            },
        });

        console.log(">>>", session.user?.id, Number(fileSize));
        await prisma.user_storage_plan.update({
            where: {user_id: Number(session.user?.id)},
            data: {
                used: {
                    increment: Number(fileSize)
                }
            },
        });

        return NextResponse.json(movie);
    } catch (error) {
        console.error("Error creating movie:", error);
        return NextResponse.json({error: "Error creating movie"}, {status: 500});
    }
}
