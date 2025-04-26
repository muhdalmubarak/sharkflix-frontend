import MovieVideo from "../components/creator-components/MovieVideo";
import Navbar from "../components/Navbar";
import RecentlyAdded from "../components/creator-components/RecentlyAdded";
import { Toaster } from "sonner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import {USER_ROLES} from "@/app/utils/constants";
import AffiliateDashboard from "../components/creator-components/AffiliateDashboard";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  return (
    <div className="p-5 lg:p-0">
      <Toaster
        position="top-right" // Default position for all toasts
        toastOptions={{
          duration: 10000, // Default duration for all toasts
          style: {
            borderRadius: "8px",
            padding: "10px",
            fontWeight: "normal",
          },
        }}
      />
      <AffiliateDashboard />
    </div>
  );
}
