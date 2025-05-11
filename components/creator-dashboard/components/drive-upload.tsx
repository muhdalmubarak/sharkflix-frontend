"use client";
import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/shadcn-ui/dialog";
import {Input} from "@/components/shadcn-ui/input";
import {Label} from "@/components/shadcn-ui/label";
import {Textarea} from "@/components/shadcn-ui/textarea";
import {Progress} from "@/components/shadcn-ui/progress";
import {useSession} from "next-auth/react";
import {Checkbox} from "@/components/shadcn-ui/checkbox";
import {uploadToStorage} from "@/app/utils/uploader";
import {useRouter} from "next/navigation";

export function DriveUploadMethod() {
    const router = useRouter();
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [videoTitle, setVideoTitle] = useState<any | "">("");
    const [videoDesc, setVideoDesc] = useState<any | "">("");
    const [price, setPrice] = useState<any | "">("");
    const [fileSize, setFileSize] = useState<any | "">("");
    const [open, onOpenChange] = useState(false);

    const {data: session} = useSession(); // Get user session
    const normalizeFilename = (filename: string): string => {
        return filename.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
    };

    const [isAffiliateVideo, setAffiliateVideo] = React.useState(false);
    const [commissionValue, setcommissionValue] = React.useState<number | "">("");

    const handleCheckboxChange = (checked: boolean) => {
        setAffiliateVideo(checked);
        if (!checked) {
            setcommissionValue(""); // Reset the numeric input value when unchecked
        }
    };

    const handleCommissionValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || /^\d+$/.test(value)) {
            setcommissionValue(Number(value));
        }
    };

    // Handle file selection
    const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2); // Convert bytes to MB
            setFileSize(sizeInMB);
            setVideoFile(file);
            const previewUrl = URL.createObjectURL(file);
            setVideoPreview(previewUrl);
        }
    };

    const handleThumbnailChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        console.log("file====", file);
        if (file) {
            setThumbnailFile(file);
        }
    };

    const handleUpload = async () => {
        if (!videoFile || !thumbnailFile) {
            alert("Please select both video and thumbnail files");
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            // Normalize the file names to avoid issues with special characters
            const normalizedVideoName = normalizeFilename(videoFile.name);
            const normalizedThumbnailName = normalizeFilename(thumbnailFile.name);

            // Define paths for storage
            const videoPath = `movie/${normalizedVideoName}`; // Path for video
            const thumbnailPath = `thumbnails/${normalizedThumbnailName}`; // Path for thumbnail

            // Upload video and thumbnail to Storage
            const videoUrl = await uploadToStorage(videoFile, videoPath);
            const thumbnailUrl = await uploadToStorage(thumbnailFile, thumbnailPath);

            const data = {
                youtubeString: videoUrl,
                imageString: thumbnailUrl,
                category: "recent",
                title: videoTitle,
                overview: videoTitle,
                age: 12,
                release: 2024,
                videoSource: videoUrl,
                duration: 2.15,
                price: price || 0,
                userId: session?.user?.id as number,
                approval_status: "approved",
                isaffiliate: isAffiliateVideo,
                commissionPercentage: commissionValue === "" ? null : Number(commissionValue)
            };

            const response = await fetch(`/api/movies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }

            onOpenChange(false);
            router.refresh();
            alert("Upload successful!");
        } catch (error) {
            console.error("Error uploading file: ", error);
            alert("Failed to upload files");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="ml-[70%]">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2"
                        x="0px"
                        y="0px"
                        width="20"
                        height="20"
                        viewBox="0 0 48 48"
                    >
                        <linearGradient
                            id="0ptTM7js1LRNIAHonm3lla_qZ1FibjKOsRJ_gr1"
                            x1="14.242"
                            x2="30.172"
                            y1="8.358"
                            y2="38.695"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset="0" stop-color="#2aa4f4"></stop>
                            <stop offset="1" stop-color="#007ad9"></stop>
                        </linearGradient>
                        <path
                            fill="url(#0ptTM7js1LRNIAHonm3lla_qZ1FibjKOsRJ_gr1)"
                            d="M48,26c0,6.63-5.37,12-12,12c-1.8,0-24.66,0-26.5,0C4.25,38,0,33.75,0,28.5	c0-4.54,3.18-8.34,7.45-9.28C9.15,12.21,15.46,7,23,7c5.51,0,10.36,2.78,13.24,7.01C42.76,14.13,48,19.45,48,26z"
                        ></path>
                        <path
                            d="M21,24.441v7c0,1.105,0.895,2,2,2h2c1.105,0,2-0.895,2-2v-7h2.648c1.336,0,2.006-1.616,1.061-2.561	l-5.295-5.295c-0.781-0.781-2.047-0.781-2.828,0l-5.295,5.295c-0.945,0.945-0.276,2.561,1.061,2.561H21z"
                            opacity=".05"
                        ></path>
                        <path
                            d="M21.5,23.941v7.5c0,0.828,0.672,1.5,1.5,1.5h2c0.828,0,1.5-0.672,1.5-1.5v-7.5h3.021	c0.938,0,1.408-1.134,0.745-1.798l-5.129-5.13c-0.627-0.627-1.644-0.627-2.271,0l-5.129,5.13c-0.663,0.663-0.194,1.798,0.745,1.798	H21.5z"
                            opacity=".07"
                        ></path>
                        <path
                            fill="#fff"
                            d="M18.607,23.441H22v8c0,0.552,0.448,1,1,1h2c0.552,0,1-0.448,1-1v-8h3.393	c0.54,0,0.81-0.653,0.428-1.034l-4.964-4.964c-0.473-0.473-1.241-0.473-1.714,0l-4.964,4.964	C17.797,22.788,18.067,23.441,18.607,23.441z"
                        ></path>
                    </svg>
                    Upload Video
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Upload Video</DialogTitle>
                    <DialogDescription>
                        Upload your video along with a thumbnail and description.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-4 px-1">
                    <div className="space-y-4 pr-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                className="col-span-3"
                                placeholder="Video Title"
                                id="title"
                                onChange={(e) => setVideoTitle(e.target.value || null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="thumbnail">Thumbnail</Label>
                            <Input
                                type="file"
                                id="thumbnail"
                                onChange={handleThumbnailChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="video">Upload Video</Label>
                            <Input
                                type="file"
                                id="video"
                                accept="video/*"
                                onChange={handleVideoChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                className="col-span-3"
                                placeholder="Type your description here."
                                id="description"
                                onChange={(e) => setVideoDesc(e.target.value || null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price in MYR</Label>
                            <Input
                                type="text"
                                className="col-span-3"
                                placeholder="Type price here"
                                id="description"
                                onChange={(e) => setPrice(e.target.value || null)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">

                                <Checkbox
                                    id="cbAffiliateVideo"
                                    checked={isAffiliateVideo}
                                    onCheckedChange={(checked) =>
                                        handleCheckboxChange(checked as boolean)
                                    }
                                ></Checkbox>
                                <label
                                    htmlFor="cbAffiliateVideo"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >Is Affiliate Video</label>
                            </div>

                            {isAffiliateVideo && (
                                <Input
                                    type="number"
                                    value={commissionValue}
                                    onChange={handleCommissionValueChange}
                                    placeholder="Enter a commission"
                                />
                            )}
                        </div>

                        {isUploading && (
                            <div className="mt-4">
                                <Label>Upload Progress</Label>
                                <Progress value={uploadProgress} className="w-full"/>
                            </div>
                        )}

                        {videoPreview && (
                            <div className="space-y-2">
                                <Label>Video Preview</Label>
                                <div className="relative w-full pt-[56.25%]">
                                    <video
                                        controls
                                        src={videoPreview}
                                        className="absolute top-0 left-0 w-full h-full rounded-md"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="flex-shrink-0 border-t pt-4">
                    <Button onClick={handleUpload} disabled={isUploading}>
                        {isUploading ? "Uploading..." : "Upload Video"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
