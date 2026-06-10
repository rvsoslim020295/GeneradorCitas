import { createMiddleware } from "hono/factory";
import prisma from "../lib/prisma.js";
import type { AuthPayload } from "./auth.js";

// Enforcement del estado del plan (auditoría 4.1).
// Debe montarse SIEMPRE después de requireAuth (necesita c.get("user")).
//
// Política:
//   SUSPENDED → bloquea TODO (lectura y escritura).
//   EXPIRED   → bloquea solo escrituras (POST/PATCH/PUT/DELETE); permite GET
//               para que el negocio vea el aviso y pueda renovar/pagar.
//   ACTIVE    → sin restricción.
//
// Nota: hace un findUnique ligero (select planStatus) por request. Se consulta
// en vivo a propósito: suspender debe tener efecto inmediato, no esperar a que
// expire el JWT.
export const requirePlanAccess = createMiddleware<{
  Variables: { user: AuthPayload };
}>(async (c, next) => {
  const user = c.get("user");
  const businessId = user?.businessId;

  // Sin businessId no hay plan que validar (no debería ocurrir tras requireAuth).
  if (!businessId) return next();

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { planStatus: true },
  });

  if (!business) return c.json({ error: "Negocio no encontrado" }, 404);

  if (business.planStatus === "SUSPENDED") {
    return c.json(
      { error: "Tu cuenta ha sido suspendida. Contacta a soporte para reactivarla.", code: "PLAN_SUSPENDED" },
      403,
    );
  }

  const isWrite = c.req.method !== "GET";
  if (business.planStatus === "EXPIRED" && isWrite) {
    return c.json(
      { error: "Tu plan ha vencido. Renueva tu suscripción para seguir operando.", code: "PLAN_EXPIRED" },
      403,
    );
  }

  return next();
});
