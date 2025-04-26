import Image from "next/image";
import { ReactNode } from "react";
import BackgroundImage from "../../public/steven-van-bTPP3jBnOb8-unsplash.jpg";
import Logo from "../../public/Red and Black Simple Modern Apparel Sport Logo.png";
import { getServerSession } from "next-auth";
import {authOptions} from "@/app/utils/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: ReactNode }) {

  const session = await getServerSession(authOptions);
  
  if (!session) {
    return redirect("/login");
  }

  return (
    <div className="relative flex h-screen w-screen flex-col bg-black md:items-center md:justify-center md:bg-transparent">
      <Image
        src={BackgroundImage}
        alt="background image"
        className="hidden sm:flex sm:object-cover -z-10 brightness-50"
        priority
        fill
      />

      <Image
        src={Logo}
        alt="Logo"
        width={120}
        height={120}
        priority
        className="absolute left-4 top-4 object-contain md:left-10 md:top-6"
      />
      {children}
    </div>
  );
}
