import {MovieCard} from "@/app/components/creator-components/MovieCard";
import {authOptions} from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import {getServerSession} from "next-auth";
import Image from "next/image";
import {EventCard} from "@/app/components/EventCard";
import {generateMediaUrl} from "@/lib/utils";

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
                    price: true,
                    WatchLists: {
                        where: {
                            userId: userId,
                        },
                    },
                },
            });
            return {type: 'movies', data};
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
                    price: true,
                    WatchLists: {
                        where: {
                            userId: userId,
                        },
                    },
                },
            });

            return {type: 'movies', data};
        }
        case "recently": {
            const data = await prisma.movie.findMany({
                where: {
                    category: "recent",
                    userId: userId,
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
                    price: true,
                    WatchLists: {
                        where: {
                            userId: userId,
                        },
                    },
                },
            });

            return {type: 'movies', data};
        }
        case "affiliate": {
            const data = await prisma.movie.findMany({
                where: {
                    category: "recent",
                    isaffiliate: true,
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
                    price: true,
                    WatchLists: {
                        where: {
                            userId: userId,

                        },
                    },
                },
            });

            return {type: 'movies', data};
        }
        case "events": {
            // New query for affiliate events
            const data = await prisma.events.findMany({
                where: {
                    isaffiliate: true,
                    status: {
                        not: 'ended'
                    }
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    date: true,
                    bookingDate: true,
                    price: true,
                    totalTickets: true,
                    availableTickets: true,
                    imageUrl: true,
                    trailerUrl: true,
                    commissionPercentage: true, // Added this to show commission info for affiliates
                    isTopRated: true,
                    soldOut: true,

                },
                orderBy: [
                    {
                        isTopRated: 'desc', // TRUE values will come first
                    },
                    {
                        date: 'desc',
                    },
                ],
            });
            return {type: 'events', data};
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
    const result = await getData(params.genre, session?.user?.id as number);

    // Create currentUser object from session data
    const currentUser = session?.user ? {
        role: session.user.role,
        AFFCode: session.user.affiliateCode,
        email: session.user.email,
        id: session.user.id
    } : null;

    return (
        <div className="w-full px-4 md:px-8 py-8">
            {result.type === 'movies' ? (
                // Grid for movies - Horizontal layout (16:9)
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.data.map((movie: any) => (
                        <div
                            key={movie.id}
                            className="bg-[#121212] rounded-lg overflow-hidden group
                      relative transform transition-all duration-300"
                        >
                            <div className="aspect-[16/9] relative w-full">
                                <Image
                                    src={generateMediaUrl(movie.imageString)}
                                    alt={movie.title || "Movie"}
                                    fill
                                    className="object-cover"
                                    quality={90}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    priority
                                />

                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                           transition-all duration-300 transform group-hover:scale-105">
                                    <MovieCard
                                        key={movie.id}
                                        age={movie.age}
                                        movieId={movie.id}
                                        overview={movie.overview}
                                        time={movie.duration}
                                        title={movie.title}
                                        wachtListId={movie.WatchLists[0]?.id}
                                        watchList={movie.WatchLists.length > 0}
                                        year={movie.release}
                                        youtubeUrl={movie.youtubeString}
                                        price={movie.price as number}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Grid for events - Vertical layout (9:16)
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {result.data.map((event: any) => (
                        <div
                            key={event.id}
                            className="bg-[#121212] rounded-lg overflow-hidden group
                      relative transform transition-all duration-300"
                        >
                            <div className="aspect-[9/16] relative w-full">
                                <div className="absolute inset-0">
                                    <Image
                                        src={generateMediaUrl(event.imageUrl)}
                                        alt={event.title}
                                        fill
                                        className="object-cover rounded-lg"
                                        quality={90}
                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                        priority
                                    />
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/90
                             opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <EventCard
                                        id={event.id}
                                        title={event.title}
                                        description={event.description}
                                        date={event.date}
                                        bookingDate={event.bookingDate}
                                        price={event.price}
                                        availableTickets={event.availableTickets}
                                        hasTicket={false}
                                        userEmail={session?.user?.email as string}
                                        imageUrl={event.imageUrl}
                                        trailerUrl={event.trailerUrl}
                                        currentUser={currentUser}
                                        showActions={false}
                                        isTopRated={event.isTopRated}
                                        soldOut={event.soldOut}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {result.data.length === 0 && (
                <div className="w-full bg-black/20 rounded-lg p-8 text-center">
                    <p className="text-gray-400 text-lg">
                        No results found
                    </p>
                    <p className="text-gray-500 mt-2">
                        Try searching with different keywords
                    </p>
                </div>
            )}
        </div>
    );
}
