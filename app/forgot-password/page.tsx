import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import GithubSignInButton from "@/app/components/GithubSignInButton";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import { redirect } from "next/navigation";
import * as Tabs from '@radix-ui/react-tabs';
import ForgotPassword from "./finalPage";

export default async function SignUp() {
  const session = await getServerSession(authOptions);
  if (session) {
    return redirect("/home");
  }

  return (

    <ForgotPassword/>
  );
}
