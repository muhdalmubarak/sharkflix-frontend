// /app/api/creator/revenues/route.ts
import {NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import {Decimal} from "@prisma/client/runtime/binary";
import {events, Movie} from "@prisma/client";

interface Transaction {
    id: bigint;
    createdAt: Date | null;
    creatorId: bigint;
    amount: Decimal;
    sourceType: string;
    sourceId: bigint;
    isPaid: boolean | null;
    paidAt: Date | null;
    updatedAt: Date | null;
    referredUserId: bigint | null;
    transactionId: string;
    movie?: Movie;
    event?: events;
}

export async function GET() {
    try {
        // Get the current user's session
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", {status: 401});
        }

        // Get user details
        const user = await prisma.user.findUnique({
            where: {email: session.user.email},
            select: {
                id: true,
                role: true,
            },
        });

        if (!user || user.role !== 'creator') {
            return new NextResponse("Unauthorized - Not a creator", {status: 403});
        }

        // Get all revenues for this creator
        let revenues = await prisma.creatorRevenue.findMany({
            where: {
                creatorId: user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Step 1: Extract all `sourceId`s grouped by `sourceType`
        const movieIds = revenues.filter(r => r.sourceType === "movie").map(r => r.sourceId);
        const eventIds = revenues.filter(r => r.sourceType === "event").map(r => r.sourceId);

        // Step 2: Batch fetch movies and events
        const [movies, events] = await Promise.all([
            prisma.movie.findMany({
                where: {id: {in: movieIds}},
                select: {id: true, title: true, price: true},
            }),
            prisma.events.findMany({
                where: {id: {in: eventIds}},
                select: {id: true, title: true, price: true},
            }),
        ]);

        // Step 3: Convert results into lookup maps
        const movieMap = new Map(movies.map(m => [m.id, m]));
        const eventMap = new Map(events.map(e => [e.id, e]));

        // Step 4: Attach movie or event details to each record efficiently
        revenues = revenues.map(revenue => {
            if (revenue.sourceType === "movie") {
                return {...revenue, movie: movieMap.get(revenue.sourceId) || null};
            } else if (revenue.sourceType === "event") {
                return {...revenue, event: eventMap.get(revenue.sourceId) || null};
            }
            return revenue;
        });

        // Calculate summary statistics
        const totalRevenue = revenues.reduce((sum, rev) => sum + Number(rev.amount), 0);
        const paidRevenue = revenues
            .filter((rev) => rev.isPaid)
            .reduce((sum, rev) => sum + Number(rev.amount), 0);
        const unpaidRevenue = revenues
            .filter((rev) => !rev.isPaid)
            .reduce((sum, rev) => sum + Number(rev.amount), 0);

        // Calculate revenue by source
        const movieRevenue = revenues
            .filter((rev) => rev.sourceType === "movie")
            .reduce((sum, rev) => sum + Number(rev.amount), 0);
        const eventRevenue = revenues
            .filter((rev) => rev.sourceType === "event")
            .reduce((sum, rev) => sum + Number(rev.amount), 0);

        // Get recent transactions (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentTransactions = revenues.filter(
            (rev) => rev.createdAt && new Date(rev.createdAt) > thirtyDaysAgo
        );

        // Format the response
        const response = {
            summary: {
                totalRevenue,
                paidRevenue,
                unpaidRevenue,
                bySource: {
                    movie: movieRevenue,
                    event: eventRevenue,
                },
            },
            recentTransactions: recentTransactions.map((rev: Transaction) => ({
                id: rev.id,
                amount: rev.amount,
                sourceType: rev.sourceType,
                sourceName: rev.sourceType === "movie" ? rev.movie?.title : rev.event?.title,
                createdAt: rev.createdAt,
                isPaid: rev.isPaid,
                paidAt: rev.paidAt,
                transactionId: rev.transactionId,
            })),
            allRevenues: revenues.map((rev: Transaction) => ({
                id: rev.id,
                amount: rev.amount,
                sourceType: rev.sourceType,
                sourceName: rev.sourceType === "movie" ? rev.movie?.title : rev.event?.title,
                createdAt: rev.createdAt,
                isPaid: rev.isPaid,
                paidAt: rev.paidAt,
                transactionId: rev.transactionId,
            })),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error in creator revenues API:", error);
        return new NextResponse("Internal Server Error", {status: 500});
    }
}
