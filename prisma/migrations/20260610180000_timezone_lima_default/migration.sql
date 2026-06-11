-- Auditoría Sprint 4: unificar zona horaria.
-- El default era America/Mexico_City pero la app siempre calculó en America/Lima.
-- Cambiamos el default y normalizamos los negocios existentes a Lima (sin
-- corrimiento, porque ya se interpretaban en Lima).
ALTER TABLE "Business" ALTER COLUMN "timezone" SET DEFAULT 'America/Lima';
UPDATE "Business" SET "timezone" = 'America/Lima' WHERE "timezone" = 'America/Mexico_City';
