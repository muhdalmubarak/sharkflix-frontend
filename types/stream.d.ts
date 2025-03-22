// types/stream.d.ts
export type DeviceType = 'webcam' | 'mobile' | 'screen';

export interface StreamSession {
    id: number;
    eventId: number;
    userId: number;
    deviceType: DeviceType;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
