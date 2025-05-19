import {USER_ROLES} from "@/app/utils/constants";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {useEffect, useRef, useState} from "react";
import ReactPlayer from "react-player";
import {generateMediaUrl} from "@/lib/utils";

interface iAppProps {
    title: string;
    overview: string;
    youtubeUrl: string;
    state: boolean;
    changeState: any;
    release: number;
    age: number;
    duration: number;
    user: any;
    movieId: number;
}

export default function PlayVideoModal({
                                           changeState,
                                           overview,
                                           state,
                                           title,
                                           youtubeUrl,
                                           age,
                                           duration,
                                           release,
                                           user,
                                           movieId
                                       }: iAppProps) {
    const playerRef = useRef<ReactPlayer | null>(null);
    const [youtubeRealUrl, setYoutubeRealUrl] = useState<string | null>(null);

    useEffect(() => {
        if (youtubeUrl) {
            generateMediaUrl(youtubeUrl)
                .then((url) => {
                    setYoutubeRealUrl(url);
                })
                .catch((error) => {
                    console.error("Error generating media URL:", error);
                    setYoutubeRealUrl(null);
                });
        }
    }, [youtubeUrl]);

    const handleProgress = (state: { playedSeconds: number }) => {
        if (state.playedSeconds >= 8 && playerRef.current) {
            playerRef.current.seekTo(0); // Loop back to 0 after 10 seconds
        }
    };

    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        let link = `${process.env.NEXT_PUBLIC_URL}/guest-user?movieId=` + movieId;

        if (user?.role == USER_ROLES.AFFILIATE) {
            link += `&refCode=${user?.AFFCode}`;
        }
        navigator.clipboard
            .writeText(link)
            .then(() => setCopied(true))
            .catch((err) => console.error("Failed to copy link: ", err));

        setTimeout(() => setCopied(false), 2000); // Reset copied message after 2 seconds
    };

    return (
        <Dialog open={state} onOpenChange={() => changeState(!state)}>
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
                    config={{file: {attributes: {controlsList: "nodownload"}}}}
                    ref={playerRef} // Reference for controlling the video
                    url={youtubeRealUrl ?? ""}
                    width="100%"
                    height="250px"
                    controls
                    onProgress={handleProgress} // Call when video progresses
                />

                <p className="text-lg font-semibold text-white">
                    <span className="mr-2 text-yellow-400">🎬</span> Purchase to watch the
                    full video for
                    <br/>
                    {/* <span className="text-yellow-500 dark:text-white ml-[38%]">🛒 {price || 0} MYR</span> */}
                </p>
                <button
                    onClick={handleCopyLink}
                    className="share-button bg-blue-500 text-white mt-2 px-4 py-2 rounded hover:bg-blue-600"
                >
                    {copied ? "Link Copied!" : "Share Link"}
                </button>
            </DialogContent>
        </Dialog>
    );
}
