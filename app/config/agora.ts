// app/config/agora.ts
export const AGORA_CONFIG = {
    appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
    appCertificate: process.env.AGORA_APP_CERTIFICATE!,
    defaultVideoConfig: {
        encoderConfig: {
            width: 640,
            height: 360,
            frameRate: 24,
            bitrateMin: 400,
            bitrateMax: 1000,
        }
    },
    defaultAudioConfig: {
        AEC: true, // Echo cancellation
        AGC: true, // Auto gain control
        ANS: true, // Auto noise suppression
    }
};

// Validate Agora configuration on startup
(() => {
    if (!AGORA_CONFIG.appId) {
        console.error('NEXT_PUBLIC_AGORA_APP_ID is not set in environment variables');
    }
    if (!AGORA_CONFIG.appCertificate) {
        console.error('AGORA_APP_CERTIFICATE is not set in environment variables');
    }
})();

export function generateAgoraConfig(channelName: string) {
    return {
        mode: "live" as const,
        codec: "vp8" as const,
        appId: AGORA_CONFIG.appId,
        channel: channelName,
    };
}

export function validateChannelName(channelName: string): boolean {
    // Channel name can only contain letters, numbers, and hyphens
    const channelNameRegex = /^[a-zA-Z0-9-]+$/;
    return channelNameRegex.test(channelName);
}
