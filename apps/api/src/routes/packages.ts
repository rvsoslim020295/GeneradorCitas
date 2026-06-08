import { Hono } from "hono";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { getLimits } from "../lib/plan-limits.js";

const packages = new Hono();
packages.use("*", requireAuth);

const packageSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  isActive: z.boolean().optional().default(true),
  serviceIds: z.array(z.string()).min(2, "Un paquete debe tener al menos 2 servicios"),
});

const packageInclude = {
  services: {
    include: {
      service: {
        select: { id: true, name: true, durationMin: true, price: true, color: true, category: true },
      },
    },
  },
} as const;

// ─── GET /packages ────────────────────────────────────────────────────────────
packages.get("/", async (c) => {
  const { businessId } = c.get("user");

  const data = await prisma.package.findMany({
    where: { businessId },
    include: packageInclude,
    orderBy: { createdAt: "desc" },
  });

  return c.json(data);
});

// ─── GET /packages/:id ────────────────────────────────────────────────────────
packages.get("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");

  const pkg = await prisma.package.findFirst({
    where: { id, businessId },
    include: packageInclude,
  });

  if (!pkg) return c.json({ error: "Paquete no encontrado" }, 404);
  return c.json(pkg);
});

// ─── POST /packages ───────────────────────────────────────────────────────────
packages.post("/", async (c) => {
  const { businessId } = c.get("user");
  const body = await c.req.json().catch(() => null);
  const parsed = packageSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, 400);
  }

  // ── Límite de paquetes según plan ─────────────────────────────────────────
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const limits = getLimits(business?.plan ?? "BASIC");

  if (limits.maxPackages !== -1) {
    const count = await prisma.package.count({ where: { businessId, isActive: true } });
    if (count >= limits.maxPackages) {
      return c.json({
        error: `Tu plan permite máximo ${limits.maxPackages} paquete${limits.maxPackages !== 1 ? "s" : ""}. Actualiza tu plan para crear más.`,
        code: "PLAN_LIMIT_PACKAGES",
      }, 403);
    }
  }

  // Verificar que todos los servicios pertenezcan al negocio
  const { serviceIds, ...rest } = parsed.data;
  const validServices = await prisma.service.findMany({
    where: { id: { in: serviceIds }, businessId },
    select: { id: true },
  });
  if (validServices.length !== serviceIds.length) {
    return c.json({ error: "Uno o más servicios no son válidos" }, 400);
  }

  const pkg = await prisma.package.create({
    data: {
      ...rest,
      businessId,
      services: {
        create: serviceIds.map((serviceId) => ({ serviceId })),
      },
    },
    include: packageInclude,
  });

  return c.json(pkg, 201);
});

// ─── PATCH /packages/:id ──────────────────────────────────────────────────────
packages.patch("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const existing = await prisma.package.findFirst({ where: { id, businessId } });
  if (!existing) return c.json({ error: "Paquete no encontrado" }, 404);

  const parsed = packageSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const { serviceIds, ...rest } = parsed.data;

  // Si se actualizan los servicios, reemplazar las relaciones
  if (serviceIds) {
    const validServices = await prisma.service.findMany({
      where: { id: { in: serviceIds }, businessId },
      select: { id: true },
    });
    if (validServices.length !== serviceIds.length) {
      return c.json({ error: "Uno o más servicios no son válidos" }, 400);
    }

    await prisma.packageService.deleteMany({ where: { packageId: id } });
    await prisma.packageService.createMany({
      data: serviceIds.map((serviceId) => ({ packageId: id, serviceId })),
    });
  }

  const pkg = await prisma.package.update({
    where: { id },
    data: rest,
    include: packageInclude,
  });

  return c.json(pkg);
});

// ─── DELETE /packages/:id ─────────────────────────────────────────────────────
packages.delete("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");

  const existing = await prisma.package.findFirst({ where: { id, businessId } });
  if (!existing) return c.json({ error: "Paquete no encontrado" }, 404);

  await prisma.package.delete({ where: { id } });
  return c.json({ ok: true });
});

export default packages;
