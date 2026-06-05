import { Hono } from "hono";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const settings = new Hono();

settings.use("*", requireAuth);

// ─── GET /settings ────────────────────────────────────────────────────────────
// Devuelve datos del negocio y del usuario autenticado
settings.get("/", async (c) => {
  const { businessId, userId } = c.get("user");

  const [business, user] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } }),
  ]);

  if (!business) return c.json({ error: "Negocio no encontrado" }, 404);

  return c.json({ business, user });
});

// ─── PATCH /settings/business ─────────────────────────────────────────────────
// Actualiza los datos del perfil del negocio
settings.patch("/business", async (c) => {
  const { businessId } = c.get("user");
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    name: z.string().min(2).optional(),
    type: z.string().min(2).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const business = await prisma.business.update({
    where: { id: businessId },
    data: parsed.data,
  });

  return c.json(business);
});

// ─── PATCH /settings/agenda ───────────────────────────────────────────────────
// Actualiza las políticas y configuración de la agenda
settings.patch("/agenda", async (c) => {
  const { businessId } = c.get("user");
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    slotMinutes: z.number().int().positive().optional(),
    cancellationHours: z.number().int().nonnegative().optional(),
    operatingDays: z.array(z.string()).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const business = await prisma.business.update({
    where: { id: businessId },
    data: parsed.data,
  });

  return c.json(business);
});

export default settings;
