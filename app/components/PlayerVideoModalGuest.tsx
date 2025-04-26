import {Button} from "@/components/shadcn-ui/button";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {ShoppingCart} from 'lucide-react';
import {useRef} from "react";
import ReactPlayer from 'react-player';

interface iAppProps {
    title: string;
    overview: string;
    youtubeUrl: string;
    state: boolean;
    changeState: any;
    release: number;
    age: number;
    duration: number;
    userEmail: any;
    price: any;
    purchasedVideos: any;
    movieId: number;
}

const stripe = require('stripe')('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');

async function payment(movieId: number, userEmail: any, price: any) {
    // Ensure movieId is a valid number
    const validatedMovieId = Number(movieId);
    if (isNaN(validatedMovieId)) {
        throw new Error('Invalid movie ID');
    }

    const timestamp = Date.now();
    const orderId = `MOVIE_${validatedMovieId}_${timestamp}`;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'myr',
                    product_data: {
                        name: 'Video', // Customize the product name
                    },
                    unit_amount: price * 100, // Custom price in cents (e.g., $10.00 = 1000 cents)
                },
                quantity: 1, // Default quantity
            },
        ],
        mode: 'payment',
        success_url: process.env.NEXT_PUBLIC_URL + '/home/recently',
        cancel_url: process.env.NEXT_PUBLIC_URL + '/home/recently',
        metadata: {
            userEmail: userEmail, // Store the user ID
            order_id: orderId, // Store the order ID
        },
    });

    window.location.href = session.url;
}

export default function PlayVideoModal({
                                           overview,
                                           title,
                                           youtubeUrl,
                                           age,
                                           duration,
                                           release,
                                           userEmail,
                                           price,
                                           purchasedVideos,
                                           movieId
                                       }: iAppProps) {

    const playerRef = useRef<ReactPlayer | null>(null);

    const handleProgress = (state: { playedSeconds: number }) => {
        if (!purchasedVideos) {
            if (state.playedSeconds >= 8 && playerRef.current) {
                playerRef.current.seekTo(0); // Loop back to 0 after 10 seconds
            }
        }

    };

    const handleSubmit = (movieId: number, userEmail: any, price: any) => {
        payment(movieId, userEmail, price)
    };

    const handleContextMenu = (event: any) => {
        event.preventDefault(); // Prevent the context menu from appearing
    };

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="line-clamp-3">
                        {overview}
                    </DialogDescription>
                    <div className="flex gap-x-2 items-center">
                        <p>{release}</p>
                        <p className="border py-0.5 px-1 border-gray-200 rounded">{age}+</p>
                        <p>{duration}h</p>
                    </div>
                </DialogHeader>

                <ReactPlayer
                    config={{file: {attributes: {controlsList: 'nodownload'}}}}
                    ref={playerRef}  // Reference for controlling the video
                    url={youtubeUrl}
                    width="100%"
                    height="250px"
                    controls
                    onContextMenu={handleContextMenu} // Prevent right-click context menu
                    onProgress={handleProgress}  // Call when video progresses
                />

                <p className="text-lg font-semibold text-white">
                    <span className="mr-2 text-yellow-400">🎬</span> Purchase to watch the full video for<br/>
                    <span className="text-yellow-500 dark:text-white ml-[38%]">🛒 {price || 0} MYR</span>
                </p>

                <Button className="mt-4" variant="destructive" disabled={price == null}
                        onClick={() => handleSubmit(movieId, userEmail, price)}>
                    <ShoppingCart className="mr-2"/>Buy
                </Button>
            </DialogContent>
        </Dialog>
    );


}
