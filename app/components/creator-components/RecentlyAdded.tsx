import Image from "next/image";
import prisma from "@/app/utils/db";
import {MovieCard} from "./MovieCard";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/utils/auth";
import {generateMediaUrl} from "@/lib/utils";

async function getData(userId: number) {
    const data = await prisma.movie.findMany({
        where: {
            userId: userId,
        },
        select: {
            id: true,
            overview: true,
            title: true,
            WatchLists: {
                where: {
                    userId: userId,
                },
            },
            imageString: true,
            youtubeString: true,
            age: true,
            release: true,
            duration: true,
            price: true
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 4,
    });

    return data;
}

export default async function RecentlyAdded() {
    const session = await getServerSession(authOptions);
    let data = await getData(session?.user?.id as number);
    data = await Promise.all(data.map(async (movie: any) => {
        const imageString = await generateMediaUrl(movie.imageString as string);
        return {
            ...movie,
            imageString
        };
    }));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-8 gap-6">
            {data.map(async (movie: any) => (
                <div key={movie.id} className="relative h-48">
                    <Image
                        src={movie.imageString}
                        alt="Movie"
                        width={500}
                        height={400}
                        className="rounded-sm absolute w-full h-full object-cover"
                    />

                    <div
                        className="h-60 relative z-10 w-full transform transition duration-500 hover:scale-125 opacity-0 hover:opacity-100">
                        <div
                            className="bg-gradient-to-b from-transparent via-black/50 to-black z-10 w-full h-full rounded-lg flex items-center justify-center border">
                            <Image
                                src={movie.imageString}
                                alt="Movie"
                                width={800}
                                height={800}
                                className="absolute w-full h-full -z-10 rounded-lg object-cover"
                            />

                            <MovieCard
                                movieId={movie.id}
                                overview={movie.overview}
                                title={movie.title}
                                wachtListId={movie.WatchLists[0]?.id}
                                youtubeUrl={movie.youtubeString}
                                watchList={movie.WatchLists.length > 0}
                                key={movie.id}
                                age={movie.age}
                                time={movie.duration}
                                year={movie.release}
                                price={movie.price as number}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
