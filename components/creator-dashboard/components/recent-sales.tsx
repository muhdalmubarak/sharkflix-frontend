'use client'
import {Avatar, AvatarFallback, AvatarImage,} from "@/components/shadcn-ui/avatar"
import {Eye} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/shadcn-ui/dialog";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {generateMediaUrl} from "@/lib/utils";

export function RecentSales({data}: { data: any }) {

    const [open, setOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>('')

    const handleClick = (item: any) => {
        setOpen(true)
        setSelectedItem(item)
    }
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(youtubeUrl ?? "")
            .then(() => setCopied(true))
            .catch(err => console.error("Failed to copy link: ", err));

        setTimeout(() => setCopied(false), 2000); // Reset copied message after 2 seconds
    };

    // This is to get signed url from cloud
    const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
    useEffect(() => {
        if (selectedItem?.youtubeString) {
            generateMediaUrl(selectedItem.youtubeString)
                .then((url) => {
                    setYoutubeUrl(url);
                })
                .catch((error) => {
                    console.error("Error generating media URL:", error);
                    setYoutubeUrl(null);
                });
        }
    }, [selectedItem.youtubeString]);

    return (
        <div className="space-y-8">
            {data.map(async (item: any) => {
                const [imageUrl, setImageUrl] = useState<string | null>(null);
                useEffect(() => {
                    generateMediaUrl(item.imageString)
                        .then(url => {
                            setImageUrl(url);
                        })
                        .catch(err => {
                            console.error('Cannot generate image URL:', err);
                            setImageUrl(null);
                        })
                }, [item.imageString]);
                return (
                    <div key={item.id} className="flex items-center" onClick={() => handleClick(item)}>
                        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
                            <AvatarImage src={imageUrl ?? ""} alt={item.title}/>
                            <AvatarFallback>
                                <img
                                    src={imageUrl ?? ""}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                />
                            </AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{item.title}</p>
                            <p className="text-sm text-muted-foreground">
                                {item.overview.slice(0, 40)}
                            </p>
                        </div>
                        <div className="ml-auto font-medium inline-flex items-center">
                            {item.age} <Eye className="ml-2"/>
                        </div>

                        {/* Dialog */}
                    </div>
                )
        })}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{selectedItem.title}</DialogTitle>
                        <DialogDescription className="line-clamp-3">
                            {selectedItem.overview}
                        </DialogDescription>
                        <div className="flex gap-x-2 items-center">
                            <p>{selectedItem.release}</p>
                            <p className="border py-0.5 px-1 border-gray-200 rounded">
                                {selectedItem.age}+
                            </p>
                            <p>{selectedItem.duration}h</p>
                        </div>
                    </DialogHeader>
                    <video controls height={250} className="w-full">
                        <source src={youtubeUrl ?? ''} type="video/quicktime"/>
                        Your browser does not support the video tag.
                    </video>
                    <Button
                        onClick={handleCopyLink}
                        className="share-button bg-blue-500 text-white mt-2 px-4 py-2 rounded hover:bg-blue-600"
                    >
                        {copied ? "Link Copied!" : "Share Link"}
                    </Button>

                </DialogContent>
            </Dialog>
        </div>
    )
}
