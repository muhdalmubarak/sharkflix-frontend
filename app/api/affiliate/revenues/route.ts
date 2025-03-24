// /app/api/affiliate/revenues/route.ts
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

    // Get user details including the affiliate code
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        affiliateCode: true
      }
    });

    if (!user || user.role !== 'affiliate') {
      return new NextResponse("Unauthorized - Not an affiliate", { status: 403 });
    }

    // Get all revenues for this affiliate
    let revenues = await prisma.affiliateRevenue.findMany({
      where: {
        affiliateId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
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
      .filter(rev => rev.isPaid)
      .reduce((sum, rev) => sum + Number(rev.amount), 0);
    const unpaidRevenue = revenues
      .filter(rev => !rev.isPaid)
      .reduce((sum, rev) => sum + Number(rev.amount), 0);

    // Calculate revenue by source
    const movieRevenue = revenues
      .filter(rev => rev.sourceType === 'movie')
      .reduce((sum, rev) => sum + Number(rev.amount), 0);
    const eventRevenue = revenues
      .filter(rev => rev.sourceType === 'event')
      .reduce((sum, rev) => sum + Number(rev.amount), 0);

    // Get recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = revenues.filter(rev => {
      if (!rev.createdAt) return false; // If rev.createdAt is null or undefined, skip this entry
      return new Date(rev.createdAt) > thirtyDaysAgo;
    });

    // Format the response
    const response = {
      summary: {
        totalRevenue,
        paidRevenue,
        unpaidRevenue,
        bySource: {
          movie: movieRevenue,
          event: eventRevenue
        }
      },
      recentTransactions: recentTransactions.map(rev => ({
        id: rev.id,
        amount: rev.amount,
        sourceType: rev.sourceType,
        sourceName: rev.sourceType === 'movie'
          ? rev.movie?.title
          : rev.event?.title,
        createdAt: rev.createdAt,
        isPaid: rev.isPaid,
        paidAt: rev.paidAt,
        transactionId: rev.transactionId
      })),
      allRevenues: revenues.map(rev => ({
        id: rev.id,
        amount: rev.amount,
        sourceType: rev.sourceType,
        sourceName: rev.sourceType === 'movie'
          ? rev.movie?.title
          : rev.event?.title,
        createdAt: rev.createdAt,
        isPaid: rev.isPaid,
        paidAt: rev.paidAt,
        transactionId: rev.transactionId
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error in affiliate revenues API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST endpoint for admin to mark revenues as paid
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return new NextResponse("Unauthorized - Admin only", { status: 403 });
    }

    const data = await request.json();
    const { revenueIds } = data;

    // Mark specified revenues as paid
    await prisma.affiliateRevenue.updateMany({
      where: {
        id: {
          in: revenueIds
        }
      },
      data: {
        isPaid: true,
        paidAt: new Date()
      }
    });

    // Update user's current_balance
    const revenues = await prisma.affiliateRevenue.findMany({
      where: {
        id: {
          in: revenueIds
        }
      },
      select: {
        affiliateId: true,
        amount: true
      }
    });

    // Group by affiliateId and sum amounts
    const affiliateBalances = revenues.reduce((acc, rev) => {
      const affiliateId = Number(rev.affiliateId); // Ensure affiliateId is treated as a number
      acc[affiliateId] = (acc[affiliateId] || 0) + Number(rev.amount);
      return acc;
    }, {} as Record<number, number>);

    // Update each affiliate's balance
    for (const [affiliateId, amount] of Object.entries(affiliateBalances)) {
      await prisma.user.update({
        where: { id: parseInt(affiliateId) },
        data: {
          current_balance: {
            decrement: amount
          }
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error in affiliate revenues POST API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
