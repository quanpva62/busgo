/*
  Warnings:

  - You are about to drop the column `dropoffStopId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `pickupStopId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the `RouteStop` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dropoffAddress` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupAddress` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dropoffAddress` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupAddress` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_dropoffStopId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_pickupStopId_fkey";

-- DropForeignKey
ALTER TABLE "RouteStop" DROP CONSTRAINT "RouteStop_routeId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "dropoffStopId",
DROP COLUMN "pickupStopId",
ADD COLUMN     "dropoffAddress" TEXT NOT NULL,
ADD COLUMN     "pickupAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "dropoffAddress" TEXT NOT NULL,
ADD COLUMN     "pickupAddress" TEXT NOT NULL;

-- DropTable
DROP TABLE "RouteStop";
