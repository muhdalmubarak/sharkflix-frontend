import { getServerSession } from "next-auth";
import { authOptions } from "../utils/auth";
import prisma from "../utils/db";
import RecentlyAddedClient from "./RecentlyAddedClient";

async function getData(userId: number): Promise<any> {
  const data  = await prisma.movie.findMany({
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
  const data = await getData(session?.user?.id as number);

  return <RecentlyAddedClient data={data} userEmail={session?.user?.email} />;
}
