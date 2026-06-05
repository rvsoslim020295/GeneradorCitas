-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "tipPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
