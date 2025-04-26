// app/creator-home/page.tsx
import { Suspense } from "react";
import MovieVideo from "../components/creator-components/MovieVideo";
import Navbar from "../components/Navbar";
import RecentlyAdded from "../components/creator-components/RecentlyAdded";
import CreatorDashboard from "../components/creator-components/CreatorDashboard";
import { Toaster } from "sonner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import {USER_ROLES} from "@/app/utils/constants";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn-ui/tabs";
import {VideoUploadDialog} from "@/app/components/creator-components/uploadVideo";

export default async function CreatorHomePage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl">Please sign in to access creator dashboard</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-5 lg:p-0">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 10000,
          style: {
            borderRadius: "8px",
            padding: "10px",
            fontWeight: "normal",
          },
        }}
      />
      <CreatorDashboard />
    </div>
  );
}
