-- Migración 2.5: Float → Decimal(10,2) para campos de dinero
-- Postgres castea double precision → numeric sin pérdida visible en valores actuales

ALTER TABLE "Appointment" ALTER COLUMN "price"         TYPE numeric(10,2) USING "price"::numeric(10,2);
ALTER TABLE "Appointment" ALTER COLUMN "paidAmount"    TYPE numeric(10,2) USING "paidAmount"::numeric(10,2);
ALTER TABLE "Appointment" ALTER COLUMN "depositAmount" TYPE numeric(10,2) USING "depositAmount"::numeric(10,2);
ALTER TABLE "Client"      ALTER COLUMN "totalSpent"    TYPE numeric(10,2) USING "totalSpent"::numeric(10,2);
ALTER TABLE "Service"     ALTER COLUMN "price"         TYPE numeric(10,2) USING "price"::numeric(10,2);
ALTER TABLE "Package"     ALTER COLUMN "price"         TYPE numeric(10,2) USING "price"::numeric(10,2);
