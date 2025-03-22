import { getServerSession } from "next-auth";
import { ReactNode } from "react";
import { authOptions } from "../utils/auth";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";

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

  // Only fetch user data if name is needed for registration check
  if (session.user?.email) {
    try {
      // Send data to the server-side API route to create the user
      const response = await fetch(
        "https://sharkflix-repo.vercel.app/api/user-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: session.user.email,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        userData = data;

        // Only redirect for registration if name is null
        if (data?.user?.name === null) {
          switch (data.user.role) {
            case "user":
              return redirect("/register-user");
            case "creator":
              return redirect("/register-creator");
            case "affiliate":
              return redirect("/register-affiliate");
          }
        }
      } else {
          console.error("Failed to fetch user data:", response.statusText);
      }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
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
