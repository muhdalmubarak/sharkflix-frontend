"use server";

import { revalidatePath } from "next/cache";
import prisma from "./utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "./utils/auth";
import { integer } from "aws-sdk/clients/cloudfront";

export async function addTowatchlist(formData: FormData) {
  "use server";

  const movieId = formData.get("movieId");
  const pathname = formData.get("pathname") as string;
  const session = await getServerSession(authOptions);

  const data = await prisma.watchList.create({
    data: {
      userId: session?.user?.id as number,
      movieId: Number(movieId),
    },
  });

  revalidatePath(pathname);
}

export async function deleteFromWatchlist(formData: FormData) {
  "use server";

  const watchlistId = formData.get("watchlistId") as unknown as number;
  const pathname = formData.get("pathname") as string;

  const data = await prisma.watchList.delete({
    where: {
      id: watchlistId,
    },
  });

  revalidatePath(pathname);
}

export async function deleteVideo(formData: FormData) {
  "use server";
  const id = Number(formData.get("movieId"));
  const pathname = formData.get("pathname") as string;

  const data = await prisma.movie.delete({
    where: {
      id: id,
    },
  });

  revalidatePath(pathname);
}

export async function getAllCreators() {
  "use server";
  const data = await prisma.user.findMany({
    where: {
      role: "creator", // Filter by role 'creator'
      // Add more conditions here if needed (e.g., active: true)
    },
    orderBy: {
      request_approved: "desc",
    },
    select: {
      id: true, // Include only the fields you need
      name: true,
      email: true,
      request_approved: true,
      role:true,
    },
  });
  return data;
}

// New action to update video details
export async function updateVideo(formData: FormData) {
  "use server";
  const movieId = Number(formData.get("movieId"));
  const pathname = formData.get("pathname") as string;
  const newTitle = formData.get("title") as string;
  const newPrice = Number(formData.get("price"));

  await prisma.movie.update({
    where: { id: movieId },
    data: {
      title: newTitle,
      price: newPrice,
    },
  });

  revalidatePath(pathname);
}

