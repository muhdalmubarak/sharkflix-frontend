// app/admin-home/layout.tsx
import { getServerSession } from "next-auth";
import { ReactNode } from "react";
import { authOptions } from "../utils/auth";
import { redirect } from "next/navigation";
import AdminNavbar from "../components/admin-components/AdminNavbar";
import prisma from "@/app/utils/db";

export default async function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return redirect("/login");
  }

  // Verify admin role
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user || user.role !== "admin") {
    return redirect("/home");
  }

  return (
    <>
      <AdminNavbar session={session} userData={user} />
      <main className="w-full max-w-7xl mx-auto sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}
