import { createRouter } from "../lib/hono.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireSuperAdmin, ADMIN_JWT_SECRET } from "../middleware/admin-auth.js";
import { loginLimiter } from "../lib/rate-limit.js";
import { getLimits } from "../lib/plan-limits.js";

const admin = createRouter();

// ─── POST /admin/auth/login ───────────────────────────────────────────────────
admin.post("/auth/login", loginLimiter, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }).safeParse(body);

  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: parsed.data.email },
  });

  if (!superAdmin) return c.json({ error: "Credenciales incorrectas" }, 401);

  const valid = await bcrypt.compare(parsed.data.password, superAdmin.password);
  if (!valid) return c.json({ error: "Credenciales incorrectas" }, 401);

  const token = jwt.sign(
    { adminId: superAdmin.id, email: superAdmin.email },
    ADMIN_JWT_SECRET,
    { expiresIn: "7d" }
  );

  const isProduction = process.env.NODE_ENV === "production";
  c.header(
    "Set-Cookie",
    `gm_admin_token=${token}; HttpOnly; SameSite=None; Path=/; Max-Age=604800; Secure`
  );

  return c.json({ name: superAdmin.name, email: superAdmin.email });
});

// ─── POST /admin/auth/logout ──────────────────────────────────────────────────
admin.post("/auth/logout", (c) => {
  c.header("Set-Cookie", "gm_admin_token=; HttpOnly; SameSite=None; Path=/; Max-Age=0");
  return c.json({ ok: true });
});

// ─── Rutas protegidas ─────────────────────────────────────────────────────────
admin.use("/businesses*", requireSuperAdmin);
admin.use("/stats", requireSuperAdmin);

// ─── GET /admin/stats ─────────────────────────────────────────────────────────
admin.get("/stats", async (c) => {
  const [total, trial, active, expired, suspended] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { plan: "TRIAL" } }),
    prisma.business.count({ where: { planStatus: "ACTIVE", plan: { not: "TRIAL" } } }),
    prisma.business.count({ where: { planStatus: "EXPIRED" } }),
    prisma.business.count({ where: { planStatus: "SUSPENDED" } }),
  ]);

  return c.json({ total, trial, active, expired, suspended });
});

// ─── GET /admin/businesses ────────────────────────────────────────────────────
admin.get("/businesses", async (c) => {
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      phone: true,
      plan: true,
      planStatus: true,
      planExpiresAt: true,
      trialEndsAt: true,
      createdAt: true,
      users: {
        where: { role: "OWNER" },
        select: { name: true, email: true },
        take: 1,
      },
      _count: { select: { appointments: true, clients: true, collaborators: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json(businesses);
});

// ─── GET /admin/businesses/:id ────────────────────────────────────────────────
admin.get("/businesses/:id", async (c) => {
  const { id } = c.req.param();

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { appointments: true, clients: true, collaborators: true, services: true } },
    },
  });

  if (!business) return c.json({ error: "Negocio no encontrado" }, 404);
  return c.json(business);
});

// ─── PATCH /admin/businesses/:id/plan ────────────────────────────────────────
admin.patch("/businesses/:id/plan", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    plan: z.enum(["TRIAL", "BASIC", "PRO", "ENTERPRISE"]),
    planStatus: z.enum(["ACTIVE", "EXPIRED", "SUSPENDED"]).optional(),
    planExpiresAt: z.string().nullable().optional(), // acepta YYYY-MM-DD o ISO datetime
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos", details: parsed.error.issues }, 400);

  let expiresDate: Date | null = null;
  if (parsed.data.planExpiresAt) {
    expiresDate = new Date(parsed.data.planExpiresAt);
    if (isNaN(expiresDate.getTime())) {
      return c.json({ error: "Fecha de vencimiento inválida" }, 400);
    }
    // Un plan ACTIVE no puede tener vencimiento en el pasado (auditoría 6.7)
    const effectiveStatus = parsed.data.planStatus ?? "ACTIVE";
    if (effectiveStatus === "ACTIVE" && expiresDate < new Date()) {
      return c.json({ error: "La fecha de vencimiento no puede estar en el pasado para un plan activo." }, 400);
    }
  }

  const business = await prisma.business.update({
    where: { id },
    data: {
      plan: parsed.data.plan,
      planStatus: parsed.data.planStatus ?? "ACTIVE",
      planExpiresAt: expiresDate,
    },
  });

  // Aviso de downgrade (auditoría 6.3): no desactivamos nada, pero informamos
  // qué recursos exceden los límites del nuevo plan para que el admin lo sepa.
  const limits = getLimits(parsed.data.plan);
  const [activeCollaborators, activePackages] = await Promise.all([
    prisma.collaborator.count({ where: { businessId: id, isActive: true } }),
    prisma.package.count({ where: { businessId: id, isActive: true } }),
  ]);
  const warnings: string[] = [];
  if (limits.maxCollaborators !== -1 && activeCollaborators > limits.maxCollaborators) {
    warnings.push(`Colaboradores activos: ${activeCollaborators}/${limits.maxCollaborators}. No podrá crear más hasta desactivar el excedente.`);
  }
  if (limits.maxPackages !== -1 && activePackages > limits.maxPackages) {
    warnings.push(`Paquetes activos: ${activePackages}/${limits.maxPackages}. No podrá crear más hasta desactivar el excedente.`);
  }

  return c.json({ ...business, warnings });
});

// ─── PATCH /admin/businesses/:id/suspend ─────────────────────────────────────
admin.patch("/businesses/:id/suspend", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);

  const schema = z.object({ suspend: z.boolean() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const business = await prisma.business.update({
    where: { id },
    data: { planStatus: parsed.data.suspend ? "SUSPENDED" : "ACTIVE" },
  });

  return c.json(business);
});

// ─── DELETE /admin/businesses/:id ────────────────────────────────────────────
admin.delete("/businesses/:id", async (c) => {
  const { id } = c.req.param();

  const business = await prisma.business.findUnique({ where: { id } });
  if (!business) return c.json({ error: "Negocio no encontrado" }, 404);

  // Orden de borrado respetando las FKs (auditoría 6.1):
  //  - appointment refiere a client/collaborator/service → va primero
  //    (AppointmentEvent cae por onDelete:Cascade sobre appointment)
  //  - packageService refiere a service (Restrict) → antes que service
  //  - user refiere a collaborator (Restrict) → antes que collaborator
  //  - client primero que nada de su lado (ClientRecord cae por Cascade)
  await prisma.$transaction([
    prisma.appointment.deleteMany({ where: { businessId: id } }),
    prisma.packageService.deleteMany({ where: { package: { businessId: id } } }),
    prisma.package.deleteMany({ where: { businessId: id } }),
    prisma.user.deleteMany({ where: { businessId: id } }),
    prisma.collaborator.deleteMany({ where: { businessId: id } }),
    prisma.client.deleteMany({ where: { businessId: id } }),
    prisma.service.deleteMany({ where: { businessId: id } }),
    prisma.business.delete({ where: { id } }),
  ]);

  return c.json({ ok: true });
});

export default admin;
