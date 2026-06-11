import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import auth from "./routes/auth.js";
import clients from "./routes/clients.js";
import collaborators from "./routes/collaborators.js";
import services from "./routes/services.js";
import appointments from "./routes/appointments.js";
import analytics from "./routes/analytics.js";
import settings from "./routes/settings.js";
import notifications from "./routes/notifications.js";
import availability from "./routes/availability.js";
import users from "./routes/users.js";
import packages from "./routes/packages.js";
import admin from "./routes/admin.js";
import { startReminderScheduler } from "./lib/reminder-scheduler.js";
import { startPlanScheduler } from "./lib/plan-scheduler.js";

const app = new Hono();

// Allowlist de orígenes permitidos para CORS con credenciales (auditoría 1.2).
// Reflejar cualquier Origin + Allow-Credentials habilita CSRF/robo de datos.
// Configurar CORS_ORIGINS en el entorno: "https://app.glowmanager.app,https://admin.glowmanager.app"
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Credentials", "true");
  }
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Vary", "Origin");
  await next();
});

app.options("*", (c) => c.text("", 200));

// Handler global de errores (auditoría 12.1): traduce errores Prisma conocidos
// a respuestas 4xx amistosas en lugar de 500 opacos, y registra el resto.
app.onError((err, c) => {
  const code = (err as { code?: string }).code;
  if (code === "P2002") return c.json({ error: "Ya existe un registro con esos datos." }, 409);
  if (code === "P2003") return c.json({ error: "No se puede completar: existen registros dependientes." }, 409);
  if (code === "P2025") return c.json({ error: "Registro no encontrado." }, 404);
  console.error("[unhandled]", err);
  return c.json({ error: "Error interno del servidor" }, 500);
});

// Health check — útil para saber si el servidor está corriendo
app.get("/health", (c) => c.json({ status: "ok", service: "GlowManager API" }));

// Rutas de autenticación bajo el prefijo /auth
app.route("/auth", auth);

// Rutas de clientes (requieren JWT)
app.route("/clients", clients);
app.route("/collaborators", collaborators);
app.route("/services", services);
app.route("/appointments", appointments);
app.route("/analytics", analytics);
app.route("/settings", settings);
app.route("/notifications", notifications);
app.route("/availability", availability);
app.route("/users", users);
app.route("/packages", packages);
app.route("/admin", admin);

const PORT = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port: PORT, hostname: "0.0.0.0" }, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
  startReminderScheduler();
  startPlanScheduler();
});
