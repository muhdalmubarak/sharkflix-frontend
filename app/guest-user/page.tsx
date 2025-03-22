import { getServerSession } from "next-auth";
import MovieVideo from "../components/MovieVideo";
import Navbar from "../components/Navbar";
import RecentlyAdded from "../components/RecentlyAdded";
import { authOptions } from "../utils/auth";
import PlayVideoModal from "../components/PlayVideoModal";
import prisma from "../utils/db";
import { useSearchParams } from "next/navigation";
import FinalPage from "./finalPage";



export default async function HomePage() {
  // const session: any = await getServerSession(authOptions);


  // async function getMovieByUrl(youtubeUrl: string) {
  //   try {
  //     const movie = await prisma.movie.findUnique({
  //       where: { youtubeUrl },
  //     });
  //     return movie;
  //   } catch (error) {
  //     console.error("Failed to fetch movie:", error);
  //     return null;
  //   }
  // }


  return (
    <div className="p-5 lg:p-0">
      {/* <MovieVideo userEmail={session?.user?.email}/> */}
      {/* <h1 className="text-3xl font-bold ">Recently Added</h1> */}
      {/* <PlayVideoModal
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
        purchasedVideos={undefined}
         /> */}
         <FinalPage/>
    </div>
  );
}
