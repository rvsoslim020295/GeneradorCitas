import { createRouter } from "../lib/hono.js";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requirePlanAccess } from "../middleware/plan-access.js";

const services = createRouter();

services.use("*", requireAuth);
services.use("*", requirePlanAccess);

const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().min(2),
  durationMin: z.number().int().positive(),
  bufferMinutes: z.number().int().min(0).optional().default(0),
  maxConcurrent: z.number().int().min(1).nullable().optional(),
  price: z.number().nonnegative(),
  color: z.string().optional().default("#3B82F6"),
  isActive: z.boolean().optional().default(true),
});

// ─── GET /services ────────────────────────────────────────────────────────────
// Lista todos los servicios del negocio, agrupados por categoría
// Acepta ?search= para filtrar por nombre
services.get("/", async (c) => {
  const { businessId } = c.get("user");
  const search = c.req.query("search")?.trim() ?? "";

  const data = await prisma.service.findMany({
    where: {
      businessId,
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Agrupamos por categoría para que el frontend no tenga que hacerlo
  const grouped = data.reduce<Record<string, typeof data>>((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {});

  return c.json({ services: data, grouped });
});

// ─── GET /services/:id ────────────────────────────────────────────────────────
services.get("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");

  const service = await prisma.service.findFirst({
    where: { id, businessId },
  });

  if (!service) return c.json({ error: "Servicio no encontrado" }, 404);
  return c.json(service);
});

// ─── POST /services ───────────────────────────────────────────────────────────
services.post("/", async (c) => {
  const { businessId } = c.get("user");
  const body = await c.req.json().catch(() => null);
  const parsed = serviceSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Datos inválidos", details: parsed.error.issues }, 400);
  }

  const service = await prisma.service.create({
    data: { ...parsed.data, businessId },
  });

  return c.json(service, 201);
});

// ─── PATCH /services/:id ──────────────────────────────────────────────────────
services.patch("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const existing = await prisma.service.findFirst({ where: { id, businessId } });
  if (!existing) return c.json({ error: "Servicio no encontrado" }, 404);

  const parsed = serviceSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const service = await prisma.service.update({ where: { id }, data: parsed.data });
  return c.json(service);
});

// ─── DELETE /services/:id ─────────────────────────────────────────────────────
services.delete("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");

  const existing = await prisma.service.findFirst({ where: { id, businessId } });
  if (!existing) return c.json({ error: "Servicio no encontrado" }, 404);

  await prisma.service.delete({ where: { id } });
  return c.json({ success: true });
});

export default services;
