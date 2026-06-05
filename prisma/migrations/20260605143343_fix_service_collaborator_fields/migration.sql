-- AlterTable
ALTER TABLE "Collaborator" ADD COLUMN     "schedule" JSONB;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#3B82F6',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
