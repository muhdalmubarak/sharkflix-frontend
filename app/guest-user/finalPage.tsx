// app/guest-user/page.tsx
"use client";
import {useEffect, useRef, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import ReactPlayer from "react-player";
import {Button} from "@/components/ui/button";
import {Loader, ShoppingCart} from "lucide-react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {PayHalalService} from '@/services/payhalal.service';
import {useSession} from "next-auth/react";
import {generateMediaUrl} from "@/lib/utils";

// Remove stripe import and configuration
// Remove the old payment function

const postData = async (url: string, body: object) => {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Request failed");
    return response.clone().json();
};

// Add PayHalal payment function
async function payment(movieId: number, refCode: string, price: number) {
    try {
        window.location.href = await PayHalalService.initiateVideoPayment({
            userEmail: refCode, // Using refCode as userEmail for affiliate tracking
            movieId,
            price
        });
    } catch (error) {
        console.error('Payment initialization failed:', error);
    }
}

export default function FinalPage() {
    const {data: session} = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const movieId = searchParams.get("movieId");
    const [showModal, setShowModal] = useState(false);
    const [affCode, setAffCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [movieData, setMovieData] = useState<any>(null);

    useEffect(() => {
        setLoading(true);

        async function loadData() {
            try {
                const data = await postData("/api/video-get", {movieId});
                if (!data) throw new Error("Video not found");
                setMovieData(data);
            } catch (error) {
                console.error("Error loading video data:", error);
            } finally {
                setLoading(false);
            }
        }

        const isAffiliateLink = () => {
            const currentUrl = window.location.href;
            const urlParams = new URLSearchParams(new URL(currentUrl).search);
            const refCode = urlParams.get("refCode");
            setAffCode(refCode || "");
            return !!refCode;
        };

        loadData();
        isAffiliateLink();
    }, [movieId]);

    const playerRef = useRef<ReactPlayer | null>(null);

    const handleProgress = (state: { playedSeconds: number }) => {
        if (state.playedSeconds >= 8 && playerRef.current) {
            playerRef.current.seekTo(0); // Loop back to 0 after 10 seconds
        }
    };

    const handleContextMenu = (event: any) => {
        event.preventDefault();
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (!affCode) {
                await payment(movieData.id, "", movieData.price);
                return;
            }

            if (session?.user) {
                // User is already logged in

                // Track affiliate
                await fetch('/api/affiliate-tracking', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({userId: session.user.id, refCode: affCode})
                });

                // Redirect to payment
                window.location.href = await PayHalalService.initiateVideoPayment({
                    userEmail: session.user.email as string,
                    movieId: movieData.id,
                    price: movieData.price
                });
            } else {
                // First check login status
                router.push(`/login?movieId=${movieData.id}&refCode=${affCode}`);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // This is to get signed url from cloud
    const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
    useEffect(() => {
        if (movieData?.youtubeString) {
            generateMediaUrl(movieData.youtubeString)
                .then((url) => {
                    setYoutubeUrl(url);
                })
                .catch((error) => {
                    console.error("Error generating media URL:", error);
                    setYoutubeUrl(null);
                });
        }
    }, [movieData]);

    return (
        <div className="p-5 lg:p-0">
            <Dialog open={true}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{movieData?.title}</DialogTitle>
                        <DialogDescription className="line-clamp-3">
                            {movieData?.overview}
                        </DialogDescription>
                    </DialogHeader>

                    <ReactPlayer
                        config={{file: {attributes: {controlsList: "nodownload"}}}}
                        ref={playerRef}
                        url={youtubeUrl ?? ""}
                        width="100%"
                        height="250px"
                        controls
                        onContextMenu={handleContextMenu}
                        onProgress={handleProgress}
                    />

                    {affCode ? (
                        <Button
                            className="mt-4"
                            variant="destructive"
                            disabled={loading || !movieData?.price}
                            onClick={() => handleSubmit()}
                        >
                            {loading ? (
                                <>
                                    <Loader className="mr-2 animate-spin"/>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="mr-2"/>
                                    Buy Now (MYR {movieData?.price || 0})
                                </>
                            )}
                        </Button>
                    ) : (
                        <>
                            <p className="text-lg font-semibold text-white">
                                <span className="mr-2 text-yellow-400">🎬</span> Purchase to
                                watch the full video
                                <br/>
                                <span className="text-yellow-500 dark:text-white">
                  MYR {movieData?.price || 0}
                </span>
                            </p>
                            <Button
                                className="mt-4"
                                variant="destructive"
                                onClick={() => router.push("/home")}
                            >
                                <ShoppingCart className="mr-2"/>
                                Sign up and Buy
                            </Button>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
