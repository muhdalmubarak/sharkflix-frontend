"use client";

import { Button } from "@/components/ui/button";
import { Heart, PlayCircle } from "lucide-react";
import PlayVideoModal from "./PlayVideoModal";
import { useState } from "react";
import { addTowatchlist, deleteFromWatchlist } from "../action";
import { usePathname } from "next/navigation";

interface iAppProps {
  title: string;
  overview: string;
  movieId: number;
  watchList: boolean;
  wachtListId: string;
  youtubeUrl: string;
  year: number;
  age: number;
  time: number;
  price: any;
  userEmail: any;
  purchasedVideos: any;
}

export function MovieCard({
  movieId,
  overview,
  title,
  wachtListId,
  watchList,
  youtubeUrl,
  age,
  time,
  year,
  price,
  userEmail,
  purchasedVideos
}: iAppProps) {
  const [open, setOpen] = useState(false);
  const pathName = usePathname();

  return (
    <>
      {/* Dark Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/90
                   opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
      />

      {/* Top Metadata - Left Corner */}
      <div className="absolute top-3 left-3 flex items-center gap-x-2 text-sm text-white z-20
                    opacity-0 group-hover:opacity-100 transition-all duration-300">
        <span>{year}</span>
        <span className="border border-white/40 px-1.5 py-0.5 rounded text-xs">
          {age}+
        </span>
        <span>{time}m</span>
      </div>

      {/* Play Button */}
      <div
        className="absolute inset-0 flex items-center justify-center
                   opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
      >
        <button
          onClick={() => setOpen(true)}
          className="transform hover:scale-110 transition-transform duration-200"
        >
          <PlayCircle className="h-12 w-12 text-white" />
        </button>
      </div>

      {/* Watchlist Heart - Top Right */}
      <div
        className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100
                   transition-all duration-300"
      >
        {watchList ? (
          <form action={deleteFromWatchlist}>
            <input type="hidden" name="watchlistId" value={wachtListId} />
            <input type="hidden" name="pathname" value={pathName} />
            <Button
              variant="outline"
              size="icon"
              className="bg-black/30 border-none hover:bg-black/50 h-8 w-8"
            >
              <Heart className="w-4 h-4 text-red-500" />
            </Button>
          </form>
        ) : (
          <form action={addTowatchlist}>
            <input type="hidden" name="movieId" value={movieId} />
            <input type="hidden" name="pathname" value={pathName} />
            <Button
              variant="outline"
              size="icon"
              className="bg-black/30 border-none hover:bg-black/50 h-8 w-8"
            >
              <Heart className="w-4 h-4 text-white" />
            </Button>
          </form>
        )}
      </div>

      {/* Bottom Content */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3 z-10
                   opacity-0 group-hover:opacity-100 transition-all duration-300"
      >
        <div className="flex justify-between items-end">
          <h1 className="font-medium text-sm text-white line-clamp-1 flex-1">
            {title}
          </h1>
          {price > 0 && (
            <div className="text-[#e50914] font-bold text-sm ml-4">
              {Number(price).toFixed(2)} MYR
            </div>
          )}
        </div>
      </div>

      <PlayVideoModal
        youtubeUrl={youtubeUrl}
        key={movieId}
        title={title}
        overview={overview}
        state={open}
        changeState={setOpen}
        age={age}
        duration={time}
        release={year}
        price={price}
        userEmail={userEmail}
        purchasedVideos={purchasedVideos}
      />
    </>
  );
}
