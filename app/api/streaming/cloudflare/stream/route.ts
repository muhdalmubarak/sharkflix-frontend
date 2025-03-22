// app/api/streaming/cloudflare/stream/route.ts
import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from "@/app/utils/auth";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
const apiKey = process.env.CLOUDFLARE_API_KEY!;

export async function POST(request: Request) {
    try {
        let streamData = null;
        const session = await getServerSession(authOptions); // Add authOptions here
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', {status: 401});
        }

        const {channelName, role} = await request.json();

        if (role === 'publisher') {
            const response = await fetch('https://api.cloudflare.com/client/v4/accounts/' + accountId + '/stream/live_inputs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    meta: {
                        name: channelName,
                    },
                    recording: {
                        mode: 'automatic'
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            streamData = await response.json();
            const {rtmps, rtmpsPlayback, srt, srtPlayback, webRTC, webRTCPlayback} = streamData.result;
            streamData.result.liveStreamURLs = {rtmps, rtmpsPlayback, srt, srtPlayback, webRTC, webRTCPlayback};
            streamData.result.streamVia = 'cloudflare'
        }

        return NextResponse.json({streamData});
    } catch (error) {
        console.error('Error generating token:', error);
        return new NextResponse('Internal Server Error', {status: 500});
    }
}
