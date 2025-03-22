// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    affiliateCode?: string | null;
    id?: number | null,
  }

  interface Session {
    user: {
      id?: number | null
      role?: string // Include the role here
      name?: string | null
      email?: string | null
      image?: string | null
      affiliateCode?: string | null
    };
  }

  interface JWT {
    role?: string;
  }
}
