// app/api/streaming/token/route.ts
import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { getServerSession } from 'next-auth';
import {authOptions} from "@/app/utils/auth";

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
const appCertificate = process.env.AGORA_APP_CERTIFICATE!;

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions); // Add authOptions here
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { channelName, role } = await request.json();

        // Set token expiry (e.g., 24 hours)
        const expirationTimeInSeconds = 3600 * 24;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        // Generate token
        const token = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            0, // uid - use 0 for dynamic assignment
            role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
            privilegeExpiredTs
        );

        // console.log('Generated token:', token);

        return NextResponse.json({ token });
    } catch (error) {
        console.error('Error generating token:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
