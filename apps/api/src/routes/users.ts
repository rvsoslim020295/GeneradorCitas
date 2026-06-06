import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const users = new Hono();

users.use("*", requireAuth);

// ─── GET /users ───────────────────────────────────────────────────────────────
users.get("/", async (c) => {
  const { businessId } = c.get("user");

  const list = await prisma.user.findMany({
    where: { businessId },
    select: { id: true, name: true, email: true, role: true, emailVerified: true },
    orderBy: { name: "asc" },
  });

  return c.json(list);
});

// ─── POST /users ──────────────────────────────────────────────────────────────
users.post("/", async (c) => {
  const { businessId } = c.get("user");
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["OWNER", "COLLABORATOR", "ADMIN"]).default("ADMIN"),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return c.json({ error: "Este email ya está registrado" }, 409);

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      role: parsed.data.role,
      emailVerified: true,
      businessId,
    },
    select: { id: true, name: true, email: true, role: true, emailVerified: true },
  });

  return c.json(user, 201);
});

// ─── PATCH /users/:id ─────────────────────────────────────────────────────────
users.patch("/:id", async (c) => {
  const { businessId } = c.get("user");
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    role: z.enum(["OWNER", "COLLABORATOR", "ADMIN"]).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const user = await prisma.user.findFirst({ where: { id, businessId } });
  if (!user) return c.json({ error: "Usuario no encontrado" }, 404);

  const updated = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, emailVerified: true },
  });

  return c.json(updated);
});

// ─── DELETE /users/:id ────────────────────────────────────────────────────────
users.delete("/:id", async (c) => {
  const { businessId, userId } = c.get("user");
  const { id } = c.req.param();

  if (id === userId) return c.json({ error: "No puedes eliminarte a ti mismo" }, 400);

  const user = await prisma.user.findFirst({ where: { id, businessId } });
  if (!user) return c.json({ error: "Usuario no encontrado" }, 404);

  await prisma.user.delete({ where: { id } });

  return c.json({ ok: true });
});

export default users;
