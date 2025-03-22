const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

export const getWebSocketURL = () => {
    return WS_URL;
};
