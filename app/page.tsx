// app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "./utils/auth";
import { redirect } from "next/navigation";
import PreviewSignupFlow from "@/app/components/PreviewSignupFlow";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    const role = session.user?.role;

    if (role === "creator") {
      return redirect("/creator-home");
    } else if (role === "affiliate") {
      return redirect("/affiliate-home");
    } else if (role === "admin") {
      return redirect("/admin-home");
    } else {
      return redirect("/home");
    }
  }

  return <PreviewSignupFlow />;
}
