import { rateLimiter } from "hono-rate-limiter";
import type { Context } from "hono";

// Rate limiting para endpoints sensibles de autenticación (auditoría 1.4 / 6.6).
// Frena fuerza bruta de contraseñas y abuso de envío de correos.
//
// Almacenamiento: en memoria (suficiente para una sola instancia en Railway).
// Si en el futuro se escala horizontalmente, migrar el store a Redis.

// En Railway el cliente real viene en x-forwarded-for (proxy). Tomamos la
// primera IP de la cadena; si no hay, caemos a un valor fijo.
function clientKey(c: Context): string {
  const fwd = c.req.header("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return c.req.header("x-real-ip") ?? "anon";
}

function tooMany(c: Context) {
  return c.json(
    { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", code: "RATE_LIMITED" },
    429,
  );
}

// Login (negocio y admin): 10 intentos por IP cada 15 minutos.
export const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-6",
  keyGenerator: clientKey,
  handler: tooMany,
});

// Recuperación de contraseña: más estricto (evita spam de correos): 5 / 15 min.
export const passwordResetLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-6",
  keyGenerator: clientKey,
  handler: tooMany,
});
