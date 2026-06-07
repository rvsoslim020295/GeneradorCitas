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
  const cookieHeader = c.req.header("Cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)gm_admin_token=([^;]+)/);
  const token = match ? match[1] : null;

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
