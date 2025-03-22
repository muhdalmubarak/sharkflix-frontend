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
    const revenues = await prisma.affiliateRevenue.findMany({
      where: {
        affiliateId: user.id
      },
      include: {
        movie: {
          select: {
            title: true,
            price: true
          }
        },
        event: {
          select: {
            title: true,
            price: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
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

    const recentTransactions = revenues.filter(rev =>
      new Date(rev.createdAt) > thirtyDaysAgo
    );

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
      acc[rev.affiliateId] = (acc[rev.affiliateId] || 0) + Number(rev.amount);
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
