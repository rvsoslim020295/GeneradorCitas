import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "admin_secret_change_in_production";

export type AdminPayload = {
  adminId: string;
  email: string;
};

export const requireSuperAdmin = createMiddleware<{
  Variables: { admin: AdminPayload };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const cookieHeader = c.req.header("Cookie") ?? "";

  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const match = cookieHeader.match(/(?:^|;\s*)gm_admin_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return c.json({ error: "Acceso no autorizado" }, 401);
  }

  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload;
    c.set("admin", payload);
    await next();
  } catch {
    return c.json({ error: "Token inválido o expirado" }, 401);
  }
});

export { ADMIN_JWT_SECRET };
