import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret_change_in_production";

export type AuthPayload = {
  userId: string;
  email: string;
  businessId: string;
  role: string;
};

// Este middleware extrae y verifica el token JWT del header Authorization
// Si el token es válido, guarda los datos del usuario en c.set("user", ...)
// Si es inválido o no existe, responde 401 Unauthorized
export const requireAuth = createMiddleware<{
  Variables: { user: AuthPayload };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Token requerido" }, 401);
  }

  const token = authHeader.slice(7); // quita "Bearer "

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Token inválido o expirado" }, 401);
  }
});

export { JWT_SECRET };
