// app/api/affiliate-tracking/route.ts
import prisma from "@/app/utils/db";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { userId, refCode } = await request.json();

  try {
    const affiliate = await prisma.user.findFirst({
      where: { affiliateCode: refCode }
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid affiliate code' }, { status: 400 });
    }

    const tracking = await prisma.affiliateTracking.upsert({
      where: {
        userId_affiliateUserId: {
          userId,
          affiliateUserId: affiliate.id
        }
      },
      update: {},
      create: {
        userId,
        affiliateUserId: affiliate.id
      }
    });

    return NextResponse.json({ success: true, tracking });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tracking' }, { status: 500 });
  }
}
