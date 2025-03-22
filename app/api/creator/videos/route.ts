// /app/api/creator/videos/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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

    // Get all videos by the creator
    const videos = await prisma.movie.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        imageString: true,
        totalviews: true,
        createdAt: true,
        price: true,
        creatorRevenues: {
          select: {
            amount: true,
          },
        },
      },
    });

    // Calculate total views and format video data
    const totalViews = videos.reduce((sum, video) => sum + (video.totalviews || 0), 0);
    const totalVideos = videos.length;

    // Calculate revenue history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueHistory = await prisma.creatorRevenue.groupBy({
      by: ['createdAt'],
      where: {
        creatorId: user.id,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Format videos with revenue data
    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      imageString: video.imageString,
      views: video.totalviews || 0,
      revenue: video.creatorRevenues.reduce((sum, rev) => sum + Number(rev.amount), 0),
      createdAt: video.createdAt,
    }));

    const response = {
      totalViews,
      totalVideos,
      revenueHistory: revenueHistory.map(entry => ({
        date: entry.createdAt.toISOString().split('T')[0],
        amount: Number(entry._sum.amount),
      })),
      recentVideos: formattedVideos.slice(0, 8), // Last 8 videos
      allVideos: formattedVideos,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in creator videos API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
