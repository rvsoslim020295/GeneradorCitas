import { Hono } from "hono";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth, JWT_SECRET } from "../middleware/auth.js";

const auth = new Hono();

// ─── Schemas de validación ───────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  businessName: z.string().min(2),
  businessType: z.string().min(2),
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
// Recibe email + password, verifica contra la DB, devuelve un JWT si es correcto
auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Email o contraseña inválidos" }, 400);
  }

  const { email, password } = parsed.data;

  // Buscamos el usuario por email
  const user = await prisma.user.findUnique({
    where: { email },
    include: { business: true },
  });

  if (!user) {
    // Usamos el mismo mensaje para no revelar si el email existe o no
    return c.json({ error: "Credenciales incorrectas" }, 401);
  }

  // bcrypt.compare compara la contraseña ingresada con el hash guardado en DB
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return c.json({ error: "Credenciales incorrectas" }, 401);
  }

  // Generamos el JWT con los datos del usuario — expira en 7 días
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      businessId: user.businessId,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return c.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      business: {
        id: user.business.id,
        name: user.business.name,
        type: user.business.type,
      },
    },
  });
});

// ─── POST /auth/register ──────────────────────────────────────────────────────
// Crea un nuevo negocio + usuario dueño en una sola operación
auth.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Datos inválidos", details: parsed.error.issues }, 400);
  }

  const { name, email, password, businessName, businessType } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return c.json({ error: "Este email ya está registrado" }, 409);
  }

  // hasheamos la contraseña antes de guardarla (salt rounds = 10)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Creamos el negocio y el usuario en una transacción atómica
  // El trial dura 7 días desde el momento del registro
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  const result = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: { name: businessName, type: businessType, trialEndsAt },
    });
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "OWNER",
        businessId: business.id,
      },
    });
    return { business, user };
  });

  const token = jwt.sign(
    {
      userId: result.user.id,
      email: result.user.email,
      businessId: result.business.id,
      role: result.user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return c.json({ token, user: { id: result.user.id, name: result.user.name, email: result.user.email } }, 201);
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
// Ruta protegida: devuelve los datos del usuario autenticado
auth.get("/me", requireAuth, async (c) => {
  const { userId } = c.get("user");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { business: true },
  });

  if (!user) return c.json({ error: "Usuario no encontrado" }, 404);

  // Calculamos días restantes del trial
  const trialEndsAt = user.business.trialEndsAt;
  const now = new Date();
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const trialActive = trialDaysLeft !== null && trialDaysLeft > 0;

  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    business: {
      id: user.business.id,
      name: user.business.name,
      type: user.business.type,
      trialEndsAt: user.business.trialEndsAt,
      trialDaysLeft,
      trialActive,
    },
  });
});

export default auth;
