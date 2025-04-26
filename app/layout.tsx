import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {NextAuthProvider} from "./components/NextAuthProvider";
import {Toaster} from "@/components/shadcn-ui/toaster";
import {Analytics} from "@vercel/analytics/react"
import {SpeedInsights} from "@vercel/speed-insights/next"

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "Sharkv", description: "Sharkv", other: {
        'permissions-policy': 'camera=*, microphone=*'
    }
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <head>
            <meta name="permissions-policy" content="camera=*, microphone=*"/>
        </head>
        <body className={inter.className}>
        <Toaster/>
        <NextAuthProvider>{children}</NextAuthProvider>
        <Analytics/>
        <SpeedInsights/>
        </body>
        </html>
    );
}

declare global {
    interface BigInt {
        toJSON(): string;
    }
}

if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
    (BigInt.prototype as any).toJSON = function () {
        return this.toString();
    };
}