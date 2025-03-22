'use client'
import { MovieCard } from "@/app/components/MovieCard"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn-ui/avatar"
import Image from "next/image"
import { Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shadcn-ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RecentSales({ data }: { data: any }) {

  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>('')

  const handleClick = (item: any) => {
    setOpen(true)
    console.log("item===", item)
    setSelectedItem(item)
  }
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(selectedItem.youtubeString)
      .then(() => setCopied(true))
      .catch(err => console.error("Failed to copy link: ", err));

    setTimeout(() => setCopied(false), 2000); // Reset copied message after 2 seconds
  };

  return (
    <div className="space-y-8">
      {data.map((item: any) => (
        <div key={item.id} className="flex items-center" onClick={() => handleClick(item)}>
          <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
            <AvatarImage src={item.imageString} alt={item.title} />
            <AvatarFallback>
              <img
                src={item.imageString}
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
            {item.age} <Eye className="ml-2" />
          </div>

          {/* Dialog */}
        </div>
      ))}
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
          {/* <iframe
            src={selectedItem.youtubeString}
            height={250}
            className="w-full"
            title="Video"
          ></iframe> */}
          <video controls height={250} className="w-full">
            <source src={selectedItem.youtubeString} type="video/quicktime" />
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
