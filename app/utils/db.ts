import {Prisma, PrismaClient } from "@prisma/client";

// Use a global variable to store the Prisma client instance for hot-reloading in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if Prisma client exists, otherwise create a new instance
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();


if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
