/*
  Warnings:

  - A unique constraint covering the columns `[userId,affiliateUserId]` on the table `AffiliateTracking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AffiliateTracking_userId_affiliateUserId_key" ON "AffiliateTracking"("userId", "affiliateUserId");
