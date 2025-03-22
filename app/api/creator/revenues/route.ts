// /app/api/creator/revenues/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";

export async function GET() {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user || user.role !== 'creator') {
      return new NextResponse("Unauthorized - Not a creator", { status: 403 });
    }

    // Get all revenues for this creator
    const revenues = await prisma.creatorRevenue.findMany({
      where: {
        creatorId: user.id,
      },
      include: {
        movie: {
          select: {
            title: true,
            price: true,
          },
        },
        event: {
          select: {
            title: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
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
      (rev) => new Date(rev.createdAt) > thirtyDaysAgo
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
      recentTransactions: recentTransactions.map((rev) => ({
        id: rev.id,
        amount: rev.amount,
        sourceType: rev.sourceType,
        sourceName: rev.sourceType === "movie" ? rev.movie?.title : rev.event?.title,
        createdAt: rev.createdAt,
        isPaid: rev.isPaid,
        paidAt: rev.paidAt,
        transactionId: rev.transactionId,
      })),
      allRevenues: revenues.map((rev) => ({
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
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
