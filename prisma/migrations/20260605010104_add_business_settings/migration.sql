-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "address" TEXT,
ADD COLUMN     "cancellationHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "operatingDays" TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri']::TEXT[],
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "slotMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City';
