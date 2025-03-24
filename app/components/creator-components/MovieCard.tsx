"use client";

import { Button } from "@/components/ui/button";
import { Edit, Heart, PlayCircle, Trash } from "lucide-react";
import PlayVideoModal from "./PlayVideoModal";
import { useState } from "react";
import { addTowatchlist, deleteFromWatchlist, deleteVideo, updateVideo } from "../../action";
import { usePathname } from "next/navigation";
import { Input } from "@/components/shadcn-ui/input";
import { USER_ROLES, CURRENT_USER } from "@/app/utils/constants";

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
  price: number;
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
}: iAppProps) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editPrice, setEditPrice] = useState<number>(price);

  const currentUser = CURRENT_USER();
  const role = currentUser?.role;
  const pathName = usePathname();

  return (
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/90
                    opacity-0 group-hover:opacity-100 transition-all duration-300">
      {/* Top Metadata - Left Corner */}
      <div className="absolute top-3 left-3 flex items-center gap-x-2 text-sm text-white z-20">
        <span>{year}</span>
        <span className="border border-white/40 px-1.5 py-0.5 rounded text-xs">
          {age}+
        </span>
        <span>{time}m</span>
      </div>

      {/* Play Button */}
      <button
        onClick={() => setOpen(true)}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
      >
        <PlayCircle className="h-12 w-12 text-white hover:scale-110 transition-transform duration-200" />
      </button>

      {/* Creator Controls */}
      {role !== USER_ROLES.AFFILIATE && (
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          {/* Watchlist Heart */}
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

          {/* Delete Button */}
          <form action={deleteVideo}>
            <input type="hidden" name="movieId" value={movieId} />
            <input type="hidden" name="pathname" value={pathName} />
            <Button
              variant="outline"
              size="icon"
              className="bg-black/30 border-none hover:bg-black/50 h-8 w-8"
            >
              <Trash className="w-4 h-4 text-red-500" />
            </Button>
          </form>

          {/* Edit Button */}
          {!isEditing && (
            <Button
              variant="outline"
              size="icon"
              className="bg-black/30 border-none hover:bg-black/50 h-8 w-8"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 text-white" />
            </Button>
          )}
        </div>
      )}

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        {isEditing ? (
          <form action={updateVideo} className="bg-black/80 p-4 rounded-lg">
            <input type="hidden" name="movieId" value={movieId} />
            <input type="hidden" name="pathname" value={pathName} />

            <div className="mb-2">
              <label className="block text-sm font-medium text-white mb-1">Title</label>
              <Input
                type="text"
                name="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-black/50 border-white/20"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-white mb-1">Price</label>
              <Input
                type="number"
                name="price"
                value={editPrice}
                onChange={(e) => setEditPrice(parseFloat(e.target.value))}
                className="bg-black/50 border-white/20"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                type="submit"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-between items-end">
            <div className="flex-1">
              <div className="font-medium text-sm text-white line-clamp-1 mb-1">
                {title}
              </div>
              {price > 0 && (
                <div className="text-[#e50914] font-bold text-sm">
                  {Number(price).toFixed(2)} MYR
                </div>
              )}
            </div>
          </div>
        )}
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
        user={currentUser}
      />
    </div>
  );
}
