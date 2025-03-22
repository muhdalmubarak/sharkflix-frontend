"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
    value: string;
    size?: number;
}

export function QRCodeDisplay({ value, size = 128 }: QRCodeDisplayProps) {
    return (
        <div className="bg-white p-2 rounded-lg">
            <QRCodeSVG
                value={value}
                size={size}
                level="H"
                includeMargin
            />
        </div>
    );
}
