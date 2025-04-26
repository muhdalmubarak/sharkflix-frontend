import { getServerSession } from "next-auth";
import { ReactNode } from "react";
import {authOptions} from "@/app/utils/auth";
import { redirect } from "next/navigation";
import Navbar from "../components/creator-components/Navbar";

export default async function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session: any = await getServerSession(authOptions);

  if (!session) {
    return redirect("/login");
  }
  let userData;

   try {
      // Send data to the server-side API route to create the user
      const response = await fetch(
        process.env.NEXT_PUBLIC_URL+"/api/user-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: session.user.email,
          }),
            // Add cache: 'no-store' to prevent caching
            cache: 'no-store'
        }
      );
       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
       }

      if (response.ok) {
        const data = await response.json();
        userData = data

        // Check registration status and redirect if needed
        if (data?.user?.name === null) {
          switch (data?.user?.role) {
              case "user":
                  return redirect("/register-user");
              case "creator":
                  return redirect("/register-creator");
              case "affiliate":
                  return redirect("/register-affiliate");
              default:
                  return redirect("/login");
          }
        }
      } else {
          console.error("Failed to fetch user data:", response.statusText);
          return redirect("/home");
      }

  } catch (error) {
      console.error("Error fetching user data:", error);
  }

  return (
    <>
      <Navbar session={session} userData={userData} />
      <main className="w-full max-w-7xl mx-auto sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}
