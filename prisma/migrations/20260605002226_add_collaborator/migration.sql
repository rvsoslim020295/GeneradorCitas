-- CreateTable
CREATE TABLE "Collaborator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "specialties" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collaborator_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
