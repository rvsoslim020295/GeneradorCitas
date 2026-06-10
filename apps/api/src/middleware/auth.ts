import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/env.js";
import prisma from "../lib/prisma.js";

export type AuthPayload = {
  userId: string;
  email: string;
  businessId: string;
  role: string;
  collaboratorId: string | null;
  tv?: number; // tokenVersion al emitir el JWT (auditoría 1.5)
};

// Este middleware extrae y verifica el token JWT del header Authorization
// Si el token es válido, guarda los datos del usuario en c.set("user", ...)
// Si es inválido o no existe, responde 401 Unauthorized
export const requireAuth = createMiddleware<{
  Variables: { user: AuthPayload };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const cookieHeader = c.req.header("Cookie") ?? "";

  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const match = cookieHeader.match(/(?:^|;\s*)gm_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return c.json({ error: "Token requerido" }, 401);
  }

  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return c.json({ error: "Token inválido o expirado" }, 401);
  }

  // Invalidación de sesiones (auditoría 1.5): el tokenVersion del JWT debe
  // coincidir con el de la BD. Tras un reset de contraseña se incrementa el de
  // la BD, dejando obsoletos todos los JWTs anteriores.
  // Tokens viejos sin claim `tv` se tratan como versión 0 (no fuerza re-login
  // en el deploy, pero sí quedan invalidados en cuanto el usuario haga reset).
  const dbUser = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { tokenVersion: true },
  });
  if (!dbUser || (payload.tv ?? 0) !== dbUser.tokenVersion) {
    return c.json({ error: "Tu sesión ha expirado. Inicia sesión de nuevo.", code: "SESSION_INVALIDATED" }, 401);
  }

  c.set("user", payload);
  await next();
});

export { JWT_SECRET };
