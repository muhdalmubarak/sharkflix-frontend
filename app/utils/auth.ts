import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./db";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs"; // For password hashing

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "your-email@example.com",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Your password",
        },
      },
      async authorize(credentials, req) {
        // Ensure `credentials` exists and has both `email` and `password`
        if (!credentials || !credentials.email || !credentials.password) {
          return null; // Invalid credentials
        }
    
        // Implement your authentication logic here
        const { email, password } = credentials;
    
        // For example, you could check the email/password against a database:
        const user = await authenticateUser(email, password);

        console.log(user)
        if (user) {
          return user; // Authentication successful, return user object
        } else {
          return null; // Authentication failed
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, user, token }) {
      // Fetch user role from the token if available, else fetch from DB
      if (token?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { role: true, affiliateCode : true, id: true }, // Fetch only the role
        });
        if (dbUser?.id) {
          session.user.id = Number(dbUser.id); // id role to session

        }
        if (dbUser?.role) {
          session.user.role = dbUser.role; // Add role to session

        }
        if (dbUser?.affiliateCode) {
          session.user.affiliateCode = dbUser.affiliateCode; // Add role to session
        }
      }

      return session;
    },
    async jwt({ token, user }) {
      // Store email and role in the token for session callback to use
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role; // Assuming `user` object has `role` field
        token.affiliateCode = user.affiliateCode; // Assuming `user` object has `role` field

      }
      return token;
    },
  },
  secret: process.env.NEXT_PUBLIC_URL,
  pages: {
    signIn: "/",
  },
} satisfies NextAuthOptions;
async function authenticateUser(email: string, password: string) {
  // Fetch user from the database using Prisma (replace this logic as necessary)
  const user:any = await prisma.user.findUnique({
    where: { email },
  });


  // If no user is found, return null
  if (!user) {
    return null;
  }

  // Compare the provided password with the hashed password stored in the database
  const isPasswordValid = await bcrypt.compare(password, user.password);

  // // If the password is incorrect, return null
  if (!isPasswordValid) {
    return null;
  }

  // If password is correct, return the user object
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role, 
    affiliateCode : user.affiliateCode ? user.affiliateCode.toString() :null
  };
}
