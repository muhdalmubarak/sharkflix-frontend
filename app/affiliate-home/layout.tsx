import { getServerSession } from "next-auth";
import { ReactNode } from "react";
import { authOptions } from "../utils/auth";
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
          }
      );

      if (response.ok) {
          const data = await response.json();
          userData = data;

          if (data?.user?.role === "user" && data?.user?.name == null) {
              return redirect("/register-user");
          }

          if (data?.user?.role == "creator" && data?.user?.name == null) {
              return redirect("/register-creator");
          }

          if (data?.user?.role == "affiliate" && data?.user?.name == null) {
              return redirect("/register-affiliate");
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
