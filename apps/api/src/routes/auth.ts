import { Hono } from "hono";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth, JWT_SECRET } from "../middleware/auth.js";
import { sendVerificationEmail } from "../lib/mailer.js";

const auth = new Hono();

// ─── Schemas ─────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  lastName: z.string().min(2),
  dni: z.string().min(6),
  ruc: z.string().min(11).max(11),
  phone: z.string().min(6),
  email: z.string().email(),
  password: z.string().min(6),
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Email o contraseña inválidos" }, 400);
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { business: true },
  });

  if (!user) return c.json({ error: "Credenciales incorrectas" }, 401);

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return c.json({ error: "Credenciales incorrectas" }, 401);

  if (!user.emailVerified) {
    return c.json({ error: "Debes verificar tu correo electrónico antes de iniciar sesión." }, 403);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, businessId: user.businessId, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const isProduction = process.env.NODE_ENV === "production";
  c.header(
    "Set-Cookie",
    `gm_token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${isProduction ? "; Secure" : ""}`
  );

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      business: { id: user.business.id, name: user.business.name, type: user.business.type },
    },
  });
});

// ─── POST /auth/register ──────────────────────────────────────────────────────
auth.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Datos inválidos", details: parsed.error.issues }, 400);
  }

  const { name, lastName, dni, ruc, phone, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return c.json({ error: "Este email ya está registrado" }, 409);

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = randomBytes(32).toString("hex");

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  const result = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: { ruc, phone, trialEndsAt },
    });
    const user = await tx.user.create({
      data: {
        name,
        lastName,
        dni,
        email,
        password: hashedPassword,
        role: "OWNER",
        businessId: business.id,
        emailVerificationToken: verificationToken,
      },
    });
    return { business, user };
  });

  // Enviar email de verificación (consola si SMTP no configurado)
  try {
    await sendVerificationEmail(email, verificationToken, name);
  } catch (err) {
    console.error("Error enviando email de verificación:", err);
  }

  return c.json({
    message: "Cuenta creada. Revisa tu correo para verificar tu cuenta.",
    email: result.user.email,
  }, 201);
});

// ─── GET /auth/verify-email?token= ───────────────────────────────────────────
auth.get("/verify-email", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.json({ error: "Token requerido" }, 400);

  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
  });

  if (!user) return c.json({ error: "Token inválido o ya utilizado" }, 400);

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null },
  });

  const jwt_token = jwt.sign(
    { userId: user.id, email: user.email, businessId: user.businessId, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const isProduction = process.env.NODE_ENV === "production";
  c.header(
    "Set-Cookie",
    `gm_token=${jwt_token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${isProduction ? "; Secure" : ""}`
  );

  return c.json({ user: { id: user.id, name: user.name, email: user.email } });
});

// ─── POST /auth/logout ───────────────────────────────────────────────────────
auth.post("/logout", (c) => {
  c.header("Set-Cookie", "gm_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  return c.json({ ok: true });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
auth.get("/me", requireAuth, async (c) => {
  const { userId } = c.get("user");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { business: true },
  });

  if (!user) return c.json({ error: "Usuario no encontrado" }, 404);

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
      logoUrl: user.business.logoUrl,
      trialEndsAt: user.business.trialEndsAt,
      trialDaysLeft,
      trialActive,
    },
  });
});

export default auth;
