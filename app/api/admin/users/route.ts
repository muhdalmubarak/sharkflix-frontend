// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/app/utils/db";
import { Prisma } from '@prisma/client';

interface RoleCount {
  [key: string]: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build the where clause for filtering
    const where: Prisma.UserWhereInput = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } as Prisma.StringNullableFilter },
            { email: { contains: search, mode: 'insensitive' } as Prisma.StringNullableFilter }
          ]
        } : {},
        role ? { role } : {}
      ]
    };

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        job_title: true,
        company: true,
        emailVerified: true,
        request_approved: true,
        total_revenue: true,
        current_balance: true,
        _count: {
          select: {
            movies: true,
            events: true,
            tickets: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: {
        id: 'desc'
      }
    });

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get today's signups
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySignups = await prisma.user.count({
      where: {
        created_at: {
          gte: today
        }
      }
    });

    // Get user statistics
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    const userStats = {
      total,
      todaySignups,
      roleBreakdown: stats.reduce<RoleCount>((acc, curr) => ({
        ...acc,
        [curr.role as string]: curr._count
      }), {})
    };

    return NextResponse.json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      },
      stats: userStats
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Update user
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
