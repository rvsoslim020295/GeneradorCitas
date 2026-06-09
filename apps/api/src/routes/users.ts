import { createRouter } from "../lib/hono.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const users = createRouter();

users.use("*", requireAuth);

// ─── GET /users — cualquier usuario autenticado puede ver la lista ─────────────
users.get("/", async (c) => {
  const { businessId } = c.get("user");

  const list = await prisma.user.findMany({
    where: { businessId },
    select: { id: true, name: true, email: true, role: true, emailVerified: true },
    orderBy: { name: "asc" },
  });

  return c.json(list);
});

// ─── POST /users — solo OWNER puede crear usuarios ────────────────────────────
users.post("/", async (c) => {
  const { businessId, role } = c.get("user");

  if (role !== "OWNER") {
    return c.json({ error: "Solo el dueño del negocio puede crear usuarios" }, 403);
  }

  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["COLLABORATOR", "ADMIN"]).default("ADMIN"),
    collaboratorId: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return c.json({ error: "Este email ya está registrado" }, 409);

  // Si se vincula un colaborador, verificar que pertenezca al negocio y no tenga usuario ya
  if (parsed.data.collaboratorId) {
    const collab = await prisma.collaborator.findFirst({
      where: { id: parsed.data.collaboratorId, businessId },
      include: { user: { select: { id: true } } },
    });
    if (!collab) return c.json({ error: "Colaborador no encontrado" }, 404);
    if (collab.user) return c.json({ error: "Este colaborador ya tiene un usuario vinculado" }, 409);
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      role: parsed.data.role,
      emailVerified: true,
      businessId,
      ...(parsed.data.collaboratorId ? { collaboratorId: parsed.data.collaboratorId } : {}),
    },
    select: { id: true, name: true, email: true, role: true, emailVerified: true },
  });

  return c.json(user, 201);
});

// ─── PATCH /users/:id — solo OWNER puede cambiar roles ───────────────────────
users.patch("/:id", async (c) => {
  const { businessId, role } = c.get("user");

  if (role !== "OWNER") {
    return c.json({ error: "Solo el dueño del negocio puede modificar usuarios" }, 403);
  }

  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    // No permitir asignar OWNER a través de este endpoint
    role: z.enum(["COLLABORATOR", "ADMIN"]).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const target = await prisma.user.findFirst({ where: { id, businessId } });
  if (!target) return c.json({ error: "Usuario no encontrado" }, 404);

  // No se puede modificar al OWNER
  if (target.role === "OWNER") {
    return c.json({ error: "No se puede modificar el rol del dueño" }, 403);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, emailVerified: true },
  });

  return c.json(updated);
});

// ─── DELETE /users/:id — solo OWNER puede eliminar usuarios ──────────────────
users.delete("/:id", async (c) => {
  const { businessId, userId, role } = c.get("user");

  if (role !== "OWNER") {
    return c.json({ error: "Solo el dueño del negocio puede eliminar usuarios" }, 403);
  }

  const { id } = c.req.param();

  if (id === userId) return c.json({ error: "No puedes eliminarte a ti mismo" }, 400);

  const target = await prisma.user.findFirst({ where: { id, businessId } });
  if (!target) return c.json({ error: "Usuario no encontrado" }, 404);

  // No se puede eliminar a otro OWNER
  if (target.role === "OWNER") {
    return c.json({ error: "No se puede eliminar al dueño del negocio" }, 403);
  }

  await prisma.user.delete({ where: { id } });

  return c.json({ ok: true });
});

export default users;
