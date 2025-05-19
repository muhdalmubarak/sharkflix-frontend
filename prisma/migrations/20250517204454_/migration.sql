/*
  Warnings:

  - You are about to drop the column `plan_type` on the `user_storage_plan` table. All the data in the column will be lost.
  - You are about to drop the column `quota_gb` on the `user_storage_plan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `user_storage_plan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user_storage_plan" DROP COLUMN "plan_type",
DROP COLUMN "quota_gb",
ADD COLUMN     "total" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "type" TEXT DEFAULT 'Free',
ADD COLUMN     "used" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "user_storage_plan_user_id_key" ON "user_storage_plan"("user_id");
