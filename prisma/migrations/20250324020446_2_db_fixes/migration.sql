-- AlterTable
ALTER TABLE "AffiliateRevenue" ADD COLUMN     "eventId" BIGINT;

-- AlterTable
ALTER TABLE "CreatorRevenue" ADD COLUMN     "eventId" BIGINT;

-- AddForeignKey
ALTER TABLE "AffiliateRevenue" ADD CONSTRAINT "AffiliateRevenue_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorRevenue" ADD CONSTRAINT "CreatorRevenue_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
