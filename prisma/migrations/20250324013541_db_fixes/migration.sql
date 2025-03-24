/*
  Warnings:

  - A unique constraint covering the columns `[affiliateCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AffiliateRevenue" ADD COLUMN     "movieId" BIGINT;

-- AlterTable
ALTER TABLE "CreatorRevenue" ADD COLUMN     "movieId" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "User_affiliateCode_key" ON "User"("affiliateCode");

-- AddForeignKey
ALTER TABLE "AffiliateRevenue" ADD CONSTRAINT "AffiliateRevenue_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorRevenue" ADD CONSTRAINT "CreatorRevenue_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE SET NULL ON UPDATE CASCADE;
