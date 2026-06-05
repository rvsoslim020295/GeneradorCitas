import { Hono } from "hono";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const collaborators = new Hono();

collaborators.use("*", requireAuth);

const collaboratorSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  specialties: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
  avatarUrl: z.string().optional(),
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

// ─── POST /collaborators ──────────────────────────────────────────────────────
collaborators.post("/", async (c) => {
  const { businessId } = c.get("user");
  const body = await c.req.json().catch(() => null);
  const parsed = collaboratorSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Datos inválidos", details: parsed.error.issues }, 400);
  }

  const collaborator = await prisma.collaborator.create({
    data: { ...parsed.data, businessId },
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
