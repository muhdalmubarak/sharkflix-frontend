'use client';

import {Button} from "@/components/ui/button";
import Image from "next/image";
import GooogleIcon from "../../public/google.svg";
import {signIn} from "next-auth/react";
import {FC, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useToast} from "@/hooks/use-toast";
import {PayHalalService} from "@/services/payhalal.service";

const GoogleSignInButton: FC = () => {
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const {toast} = useToast();

    const handlePaymentRedirect = async (session: any) => {
        const eventId = searchParams.get('eventId');
        const movieId = searchParams.get('movieId');
        const refCode = searchParams.get('refCode');

        // Validate user data from session
        if (!session?.user?.id || !session?.user?.email) {
            throw new Error('Invalid user session data');
        }

        // Handle affiliate tracking if refCode exists
        if (refCode) {
            await fetch('/api/affiliate-tracking', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    userId: session.user.id,
                    refCode
                })
            });
        }

        // Handle event ticket purchase
        if (eventId) {
            if (!eventId || isNaN(Number(eventId))) {
                throw new Error('Invalid event ID');
            }

            const response = await fetch(`/api/events/${eventId}`);
            if (!response.ok) {
                throw new Error('Event not found');
            }

            const event = await response.json();
            if (!event?.id || !event?.title || !event?.price) {
                throw new Error('Invalid event data');
            }

            toast({
                title: "Redirecting to payment",
                description: "Please wait while we process your request"
            });

            const paymentUrl = await PayHalalService.initiateTicketPayment({
                userEmail: session.user.email,
                eventId: event.id,
                title: event.title,
                price: event.price
            });

            if (!paymentUrl) {
                throw new Error('Failed to generate payment URL');
            }

            window.location.href = paymentUrl;
            return;
        }

        // Handle video purchase
        if (movieId) {

            const movie = await fetch("/api/video-get", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({movieId})
            }).then(res => res.json());

            if (!movie?.youtubeString || !movie?.price) {
                throw new Error('Invalid video data');
            }

            toast({
                title: "Redirecting to payment",
                description: "Please wait while we process your request"
            });

            const paymentUrl = await PayHalalService.initiateVideoPayment({
                userEmail: session.user.email,
                movieId: movie.id,
                price: movie.price
            });

            if (!paymentUrl) {
                throw new Error('Failed to generate payment URL');
            }

            window.location.href = paymentUrl;
            return;
        }

        // If no payment needed, redirect based on role
        switch (session.user.role) {
            case "creator":
                router.push("/creator-home");
                break;
            case "affiliate":
                router.push("/affiliate-home");
                break;
            case "admin":
                router.push("/admin-home");
                break;
            default:
                router.push("/home");
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);

            // Attempt Google sign in
            const result = await signIn("google", {
                redirect: false,
                callbackUrl: "/api/auth/callback/google"
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            // After successful sign in, get the session data
            const response = await fetch("/api/auth/session");
            const session = await response.json();

            // Store user data in localStorage
            if (session?.user) {
                localStorage.setItem("user", JSON.stringify({
                    role: session.user.role,
                    AFFCode: session.user.affiliateCode,
                    email: session.user.email,
                    id: session.user.id,
                }));
            }

            // Handle payment redirect with session data
            await handlePaymentRedirect(session);

            toast({
                title: "Success",
                description: "Successfully logged in with Google"
            });

        } catch (error) {
            console.error("Google sign in error:", error);
            toast({
                variant: "destructive",
                title: "Authentication Failed",
                description: error instanceof Error ? error.message : "Failed to sign in with Google"
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            size="icon"
        >
            {loading ? (
                <div className="flex items-center space-x-2">
                    <span className="loading loading-spinner"></span>
                </div>
            ) : (
                <div className="flex items-center space-x-2">
                    <Image src={GooogleIcon} alt="Google icon" className="w-6 h-6"/>
                </div>
            )}
        </Button>
    );
}

export default GoogleSignInButton;
