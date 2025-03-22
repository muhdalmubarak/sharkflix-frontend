// RecentlyAddedClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { MovieCard } from "./MovieCard";

interface WatchList {
  id: number;
  userId: number;
  movieId: number | null;
}

interface Movie {
  id: number;
  overview: string;
  title: string;
  WatchLists: WatchList[];
  imageString: string;
  youtubeString: string;
  age: number;
  release: number;
  duration: number;
  price: number | null;
}

interface RecentlyAddedClientProps {
  data: Movie[];
  userEmail: string | null | undefined;
}

const RecentlyAddedClient: React.FC<RecentlyAddedClientProps> = ({ data, userEmail }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isMobile) {
      const container = e.currentTarget;
      const scrollPosition = container.scrollLeft;
      const itemWidth = container.offsetWidth;
      const newIndex = Math.round(scrollPosition / itemWidth);
      setActiveIndex(newIndex);
    }
  };

  const MovieItem = ({ movie }: { movie: Movie }) => (
    <div className={`${isMobile ? 'flex-none w-[80%] snap-center' : 'w-full'} 
                  bg-[#121212] rounded-lg overflow-hidden group
                  transform transition-all duration-300 hover:scale-105`}>
    <div className="aspect-[16/9] relative w-full">
      <Image
        src={movie.imageString}
        alt={movie.title}
        fill
        className="object-cover"
        quality={90}
        sizes="(max-width: 768px) 80vw, (max-width: 1200px) 40vw, 25vw"
        priority
      />

      <MovieCard
        movieId={movie.id}
        overview={movie.overview}
        title={movie.title}
        wachtListId={String(movie.WatchLists[0]?.id)}
        youtubeUrl={movie.youtubeString}
        watchList={movie.WatchLists.length > 0}
        key={movie.id}
        age={movie.age}
        time={movie.duration}
        year={movie.release}
        price={movie.price ?? 0}
        userEmail={userEmail}
        purchasedVideos={undefined}
      />
    </div>
  </div>
  );

  if (data.length === 0) {
    return (
      <div className="col-span-full text-center py-12 bg-black/20 rounded-lg">
        <p className="text-gray-400">No movies available.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Recently Added</h1>

      {isMobile ? (
        // Mobile: Horizontal Scroll
        <div className="relative w-full overflow-x-auto">
          <div
            className="flex space-x-4 pb-6 snap-x snap-mandatory overflow-x-auto scrollbar-hide"
            onScroll={handleScroll}
          >
            {data.map((movie) => (
              <MovieItem key={movie.id} movie={movie} />
            ))}
          </div>

          {data.length > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              {data.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index === activeIndex ? 'bg-[#e50914]' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Desktop: Grid Layout
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map((movie) => (
            <MovieItem key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentlyAddedClient;
