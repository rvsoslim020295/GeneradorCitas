import { createRouter } from "../lib/hono.js";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requirePlanAccess } from "../middleware/plan-access.js";
import { getLimits } from "../lib/plan-limits.js";

const collaborators = createRouter();

collaborators.use("*", requireAuth);
collaborators.use("*", requirePlanAccess);

const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  start: z.string(),
  end: z.string(),
});

const collaboratorSchema = z.object({
  name: z.string().min(2),
  lastName: z.string().optional(),
  role: z.string().min(2),
  specialties: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
  performsServices: z.boolean().optional().default(true),
  avatarUrl: z.string().optional(),
  schedule: z.record(z.string(), dayScheduleSchema).optional(),
  documentType: z.enum(["DNI", "CE"]).optional(),
  documentNumber: z.string().optional(),
  phone: z.string().optional(),
});

// ─── GET /collaborators ───────────────────────────────────────────────────────
collaborators.get("/", async (c) => {
  const { businessId } = c.get("user");
  const search = c.req.query("search")?.trim() ?? "";

  const data = await prisma.collaborator.findMany({
    where: {
      businessId,
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    },
    orderBy: { name: "asc" },
  });

  return c.json(data);
});

// ─── GET /collaborators/:id ───────────────────────────────────────────────────
collaborators.get("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");

  const collaborator = await prisma.collaborator.findFirst({
    where: { id, businessId },
  });

  if (!collaborator) return c.json({ error: "Colaborador no encontrado" }, 404);

  return c.json(collaborator);
});

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildDefaultSchedule(openTime: string, closeTime: string, operatingDays: string[]) {
  return Object.fromEntries(
    ALL_DAYS.map(day => [day, {
      enabled: operatingDays.includes(day),
      start: openTime,
      end: closeTime,
    }])
  );
}

// ─── POST /collaborators ──────────────────────────────────────────────────────
collaborators.post("/", async (c) => {
  const { businessId } = c.get("user");
  const body = await c.req.json().catch(() => null);
  const parsed = collaboratorSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Datos inválidos", details: parsed.error.issues }, 400);
  }

  // ── Verificar límite de colaboradores según plan ──────────────────────────
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const limits = getLimits(business?.plan ?? "BASIC");

  if (limits.maxCollaborators !== -1) {
    const count = await prisma.collaborator.count({ where: { businessId, isActive: true } });
    if (count >= limits.maxCollaborators) {
      return c.json({
        error: `Tu plan ${business?.plan ?? "actual"} permite máximo ${limits.maxCollaborators} colaborador${limits.maxCollaborators !== 1 ? "es" : ""}. Actualiza tu plan para agregar más.`,
        code: "PLAN_LIMIT_COLLABORATORS",
      }, 403);
    }
  }

  const collaborator = await prisma.collaborator.create({
    data: {
      ...parsed.data,
      schedule: parsed.data.schedule ?? buildDefaultSchedule(
        business?.openTime  ?? "09:00",
        business?.closeTime ?? "18:00",
        business?.operatingDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri"],
      ),
      businessId,
    },
  });

  return c.json(collaborator, 201);
});

// ─── PATCH /collaborators/:id ─────────────────────────────────────────────────
collaborators.patch("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const existing = await prisma.collaborator.findFirst({
    where: { id, businessId },
  });
  if (!existing) return c.json({ error: "Colaborador no encontrado" }, 404);

  const parsed = collaboratorSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Datos inválidos" }, 400);
  }

  const collaborator = await prisma.collaborator.update({
    where: { id },
    data: parsed.data,
  });

  return c.json(collaborator);
});

// ─── DELETE /collaborators/:id ────────────────────────────────────────────────
collaborators.delete("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");

  const existing = await prisma.collaborator.findFirst({
    where: { id, businessId },
  });
  if (!existing) return c.json({ error: "Colaborador no encontrado" }, 404);

  await prisma.collaborator.delete({ where: { id } });

  return c.json({ success: true });
});

export default collaborators;
