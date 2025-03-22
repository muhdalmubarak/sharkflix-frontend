import { Button } from "@/components/ui/button";
import prisma from "../utils/db";
import MovieButtons from "./MovieButtons";

async function getData() {
  const data = await prisma.movie.findFirst({
    where: {
      id: 41,
    },
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
      price:true
    },
  });
  
  return data;
}

async function purchasedVideos(userEmail:any) {
  const data = await prisma.purchased_videos.findMany({
    select:{
      user_email:true,
      youtube_url:true
    }
  });
  return data;
}

interface PurchasedVideo {
  user_email: string;
  youtube_url: string;
}

async function movewVideos(userEmail:any,purchasedVideosUser:any) {

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
      price:true
    },
    where:{
      youtubeString: {
        in: youtubeUrls, 
      }
    }
  });
  return data;
}

export default async function MovieVideo(userEmail:any) {
  const data = await getData();
  let purchasedVideosUser;
  let purchasedVideosUse = await purchasedVideos(userEmail);
  purchasedVideosUser = purchasedVideosUse?.filter((v)=>v.user_email == userEmail.userEmail) || []
  const purchasedMoview = await movewVideos(userEmail,purchasedVideosUser)
  console.log("purchaseMoview=6666==",purchasedMoview)

  return (
    <div className="h-[55vh] lg:h-[60vh] w-full flex justify-start items-center">
      <video
        poster={data?.imageString}
        autoPlay
        muted
        loop
        src={data?.videoSource}
        className="w-full absolute top-0 left-0 h-[85vh] object-cover -z-10 brightness-[60%]"
      ></video>

      <div className="absolute w-[90%] lg:w-[40%] mx-auto">
        <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold">
          {data?.title}
        </h1>
        <p className="text-white text-lg mt-5 line-clamp-3">{data?.overview}</p>
        <div className="flex gap-x-3 mt-4">
          <MovieButtons
            age={data?.age as number}
            duration={data?.duration as number}
            id={data?.id as number}
            overview={data?.overview as string}
            releaseDate={data?.release as number}
            title={data?.title as string}
            youtubeUrl={data?.youtubeString as string}
            key={data?.id}
            userEmail={userEmail}
            price={data?.price as any}
            purchasedVideos={purchasedMoview}
          />
        </div>
      </div>
    </div>
  );
}
