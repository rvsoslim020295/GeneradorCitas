-- Auditoría 1.5: invalidación de sesiones JWT.
-- tokenVersion se incrementa al resetear contraseña / cerrar sesión global;
-- requireAuth compara el valor del token contra este para rechazar JWTs previos.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
