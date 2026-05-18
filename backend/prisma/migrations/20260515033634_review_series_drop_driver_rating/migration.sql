/*
  Warnings:

  - You are about to drop the column `rating` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `totalTrips` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `tripId` on the `Review` table. All the data in the column will be lost.
  - Added the required column `seriesId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_tripId_fkey";

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "rating",
DROP COLUMN "totalTrips";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "tripId",
ADD COLUMN     "seriesId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Review_seriesId_idx" ON "Review"("seriesId");
