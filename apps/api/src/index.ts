import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
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

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

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

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
  startReminderScheduler();
});
