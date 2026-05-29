-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "commissionAmount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.1;
