import { MovieCard } from "@/app/components/MovieCard";
import { authOptions } from "@/app/utils/auth";
import prisma from "@/app/utils/db";
import { DriveUploadMethod } from "@/components/creator-dashboard/components/drive-upload";
import { getServerSession } from "next-auth";
import Image from "next/image";

export default function PaymentMethod() {

  return (

    <DriveUploadMethod/>

  );
}
