import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import GithubSignInButton from "@/app/components/GithubSignInButton";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import { redirect } from "next/navigation";
import { signIn } from "next-auth/react";
import FinalLogin from "./finalPage";

export default async function Login() {
  const session = await getServerSession(authOptions);

  // If session exists, verify role from session directly
  if (session?.user?.email) {
    // Get role from session instead of making another API call
    const role = session.user.role;

    if (role) {
      switch (role) {
        case "creator":
          redirect("/creator-home");
          break;
        case "affiliate":
          redirect("/affiliate-home");
          break;
        case "admin":
          redirect("/admin-home");
          break;
        default:
          redirect("/home");
      }
    }
  }

  return <FinalLogin />;
}

