import { MovieCard } from "@/app/components/MovieCard";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import { getServerSession } from "next-auth";
import Image from "next/image";

async function getData(category: string, userId: number) {
  
  switch (category) {
    case "shows": {
      const data = await prisma.movie.findMany({
        where: {
          category: "show",
        },
        select: {
          age: true,
          duration: true,
          id: true,
          title: true,
          release: true,
          imageString: true,
          overview: true,
          youtubeString: true,
          price:true,
          WatchLists: {
            where: {
              userId: userId,
            },
          },
        },
      });
      return data;
    }
    case "movies": {
      const data = await prisma.movie.findMany({
        where: {
          category: "movie",
        },
        select: {
          age: true,
          duration: true,
          id: true,
          release: true,
          imageString: true,
          overview: true,
          youtubeString: true,
          title: true,
          price:true,
          WatchLists: {
            where: {
              userId: userId,
            },
          },
        },
      });

      return data;
    }
    case "recently": {
      
      const data = await prisma.movie.findMany({
        where: {
          category: "recent",
        },
        select: {
          age: true,
          duration: true,
          id: true,
          release: true,
          imageString: true,
          overview: true,
          youtubeString: true,
          title: true,
          price:true,
          WatchLists: {
            where: {
              userId: userId,
            },
          },
        },
      });

      return data;
    }
    default: {
      throw new Error();
    }
  }
}

export default async function CategoryPage({
  params,
}: {
  params: { genre: string };
}) {
  const session = await getServerSession(authOptions);
  const data = await getData(params.genre, session?.user?.id as number);

  return (
     <div className="w-full px-4 md:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 capitalize">
        {params.genre}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.map((movie: any) => (
          <div
            key={movie.id}
            className="bg-[#121212] rounded-lg overflow-hidden group
                      transform transition-all duration-300 hover:scale-105"
          >
            <div className="aspect-[16/9] relative w-full">
              <Image
                src={movie.imageString}
                alt={movie.title}
                fill
                className="object-cover"
                quality={90}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                priority
              />

              <MovieCard
                movieId={movie.id}
                overview={movie.overview}
                title={movie.title}
                wachtListId={movie.WatchLists[0]?.id}
                watchList={movie.WatchLists.length > 0}
                youtubeUrl={movie.youtubeString}
                age={movie.age}
                time={movie.duration}
                year={movie.release}
                price={movie?.price ?? 0}
                userEmail={session?.user?.email}
                purchasedVideos={undefined}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
