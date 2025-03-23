/*
  Warnings:

  - You are about to alter the column `payoutId` on the `CreatorRevenue` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- DropForeignKey
ALTER TABLE "CreatorPayout" DROP CONSTRAINT "CreatorPayout_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "CreatorRevenue" DROP CONSTRAINT "CreatorRevenue_payoutId_fkey";

-- AlterTable
ALTER TABLE "CreatorPayout" ALTER COLUMN "creatorId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "CreatorRevenue" ALTER COLUMN "payoutId" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "liveStreamURLs" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "streamId" VARCHAR(255),
ADD COLUMN     "streamVia" VARCHAR(100);

-- CreateIndex
CREATE INDEX "idx_live_stream_urls" ON "events" USING GIN ("liveStreamURLs");

-- CreateIndex
CREATE INDEX "idx_stream_id" ON "events"("streamId");

-- CreateIndex
CREATE INDEX "idx_stream_via" ON "events"("streamVia");

-- CreateIndex
CREATE INDEX "idx_stream_via_id" ON "events"("streamVia", "streamId");

-- AddForeignKey
ALTER TABLE "CreatorRevenue" ADD CONSTRAINT "CreatorRevenue_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "CreatorPayout"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
