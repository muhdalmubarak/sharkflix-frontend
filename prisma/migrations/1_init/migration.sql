-- DropForeignKey
ALTER TABLE "CreatorRevenue" DROP CONSTRAINT "CreatorRevenue_payoutId_fkey";

-- DropForeignKey
ALTER TABLE "CreatorPayout" DROP CONSTRAINT "CreatorPayout_creatorId_fkey";

-- AlterTable
ALTER TABLE "CreatorRevenue" ALTER COLUMN "payoutId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "CreatorPayout" ALTER COLUMN "creatorId" SET DATA TYPE INTEGER;

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CreatorRevenue" ADD CONSTRAINT "CreatorRevenue_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "CreatorPayout"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

