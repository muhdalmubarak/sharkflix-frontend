import { MovieCard } from "@/app/components/MovieCard";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import { getServerSession } from "next-auth";
import Image from "next/image";

async function getData() {
  const data = await prisma.movie.findFirst({
    select: {
      title: true,
      overview: true,
      videoSource: true,
      imageString: true,
      release: true,
      duration: true,
      id: true,
      age: true,
      youtubeString: true,
      price: true
    },
  });
  return data;
}

async function purchasedVideos(userEmail: any) {
  const data = await prisma.purchased_videos.findMany({
    select: {
      user_email: true,
      youtube_url: true
    }
  });
  return data;
}

interface PurchasedVideo {
  user_email: string;
  youtube_url: string;
}

async function movewVideos(userEmail: any, purchasedVideosUser: any) {
  const youtubeUrls = purchasedVideosUser.map((video: PurchasedVideo) => video.youtube_url);

  const data = await prisma.movie.findMany({
    select: {
      title: true,
      overview: true,
      videoSource: true,
      imageString: true,
      release: true,
      duration: true,
      id: true,
      age: true,
      youtubeString: true,
      price: true
    },
    where: {
      youtubeString: {
        in: youtubeUrls,
      }
    }
  });
  return data;
}

export default async function Watchlist() {
  const session = await getServerSession(authOptions);
  const data = await getData();
  const userEmail = session?.user?.email;
  let purchasedVideosUser;
  let purchasedVideosUse = await purchasedVideos(userEmail);
  purchasedVideosUser = purchasedVideosUse?.filter((v) => v.user_email == userEmail) || []
  const purchasedMoview = await movewVideos(userEmail, purchasedVideosUser);

  return (
    <div className="w-full px-4 md:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">
        Purchased Videos
      </h1>

      {purchasedMoview.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {purchasedMoview.map((movie) => (
            <div
              key={movie?.id}
              className="bg-[#121212] rounded-lg overflow-hidden group
                        transform transition-all duration-300 hover:scale-105"
            >
              <div className="aspect-[16/9] relative w-full">
                <Image
                  src={movie?.imageString as string}
                  alt={movie?.title || "Movie"}
                  fill
                  className="object-cover"
                  quality={90}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  priority
                />

                <MovieCard
                  key={movie?.id}
                  age={movie?.age as number}
                  movieId={movie?.id as number}
                  overview={movie?.overview as string}
                  time={movie?.duration as number}
                  title={movie?.title as string}
                  watchList={(purchasedMoview?.length as number) > 0}
                  year={movie?.release as number}
                  youtubeUrl={movie?.youtubeString as string}
                  wachtListId={""}
                  price={undefined}
                  userEmail={undefined}
                  purchasedVideos={purchasedMoview || undefined}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full bg-black/20 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-lg">
            No purchased videos yet.
          </p>
          <p className="text-gray-500 mt-2">
            Videos you purchase will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
