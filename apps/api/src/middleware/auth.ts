import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret_change_in_production";

export type AuthPayload = {
  userId: string;
  email: string;
  businessId: string;
  role: string;
  collaboratorId: string | null;
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

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Token inválido o expirado" }, 401);
  }
});

export { JWT_SECRET };
