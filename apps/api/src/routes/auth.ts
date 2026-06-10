import { createRouter } from "../lib/hono.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth, JWT_SECRET } from "../middleware/auth.js";
import { ADMIN_JWT_SECRET } from "../middleware/admin-auth.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/mailer.js";
import { validateEmailDeep } from "../lib/email-validator.js";

const auth = createRouter();

// ─── Schemas ─────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  lastName: z.string().min(2),
  dni: z.string().length(8).optional().or(z.literal("")).transform(v => v || undefined),
  ruc: z.string().length(11).optional().or(z.literal("")).transform(v => v || undefined),
  phone: z.string().regex(/^\d{9}$/, "El teléfono debe tener exactamente 9 dígitos"),
  email: z.string().email("Correo electrónico inválido"),
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
  const rememberMe = (body as Record<string, unknown>)?.rememberMe === true;
  const isProduction = process.env.NODE_ENV === "production";
  // Sin rememberMe → sin Max-Age (cookie de sesión, se borra al cerrar el navegador)
  // Con rememberMe → 30 días
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : null;

  // ── Intentar como usuario de negocio primero ──────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email },
    include: { business: true, collaborator: { select: { id: true } } },
  });

  if (user) {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return c.json({ error: "Contraseña incorrecta. Inténtalo de nuevo.", code: "WRONG_PASSWORD" }, 401);

    if (!user.emailVerified) {
      return c.json({ error: "Debes verificar tu correo electrónico antes de iniciar sesión." }, 403);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, businessId: user.businessId, role: user.role, collaboratorId: user.collaborator?.id ?? null },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    c.header(
      "Set-Cookie",
      `gm_token=${token}; HttpOnly; SameSite=None; Path=/${maxAge ? `; Max-Age=${maxAge}` : ""}; Secure`
    );

    return c.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        collaboratorId: user.collaborator?.id ?? null,
        business: {
          id: user.business.id,
          name: user.business.name,
          type: user.business.type,
          plan: user.business.plan,
          planStatus: user.business.planStatus,
        },
      },
    });
  }

  // ── Intentar como super admin ─────────────────────────────────────────────
  const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });

  if (superAdmin) {
    const validPassword = await bcrypt.compare(password, superAdmin.password);
    if (!validPassword) return c.json({ error: "Contraseña incorrecta. Inténtalo de nuevo.", code: "WRONG_PASSWORD" }, 401);

    const token = jwt.sign(
      { adminId: superAdmin.id, email: superAdmin.email },
      ADMIN_JWT_SECRET,
      { expiresIn: "7d" }
    );

    c.header(
      "Set-Cookie",
      `gm_admin_token=${token}; HttpOnly; SameSite=None; Path=/${maxAge ? `; Max-Age=${maxAge}` : ""}; Secure`
    );

    return c.json({
      token,
      user: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: "SUPER_ADMIN",
      },
    });
  }

  return c.json({ error: "No existe una cuenta con ese correo electrónico.", code: "EMAIL_NOT_FOUND" }, 404);
});

// ─── POST /auth/register ──────────────────────────────────────────────────────
auth.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Datos inválidos", details: parsed.error.issues }, 400);
  }

  const { name, lastName, dni, ruc, phone, email, password } = parsed.data;

  // Validación profunda del correo (MX + desechables + AbstractAPI opcional)
  const emailCheck = await validateEmailDeep(email);
  if (!emailCheck.valid) {
    return c.json({ error: emailCheck.error }, 422);
  }

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
    `gm_token=${jwt_token}; HttpOnly; SameSite=None; Path=/; Max-Age=604800; Secure`
  );

  return c.json({ token: jwt_token, user: { id: user.id, name: user.name, email: user.email } });
});

// ─── POST /auth/logout ───────────────────────────────────────────────────────
auth.post("/logout", (c) => {
  // Borrar cookie con todas las variantes para cubrir local (Lax) y producción (None+Secure)
  c.header("Set-Cookie", [
    "gm_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
    "gm_token=; HttpOnly; SameSite=None; Secure; Path=/; Max-Age=0",
  ].join(", "));
  return c.json({ ok: true });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
auth.get("/me", requireAuth, async (c) => {
  const { userId } = c.get("user");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { business: true, collaborator: { select: { id: true } } },
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
    collaboratorId: user.collaborator?.id ?? null,
    business: {
      id: user.business.id,
      name: user.business.name,
      type: user.business.type,
      logoUrl: user.business.logoUrl,
      plan: user.business.plan,
      planStatus: user.business.planStatus,
      trialEndsAt: user.business.trialEndsAt,
      trialDaysLeft,
      trialActive,
    },
  });
});

// ─── GET /auth/test-email?to=EMAIL ───────────────────────────────────────────
auth.get("/test-email", async (c) => {
  const to = c.req.query("to");
  if (!to) return c.json({ error: "Falta ?to=email" }, 400);

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return c.json({ ok: false, error: "BREVO_API_KEY no configurado en Railway" }, 500);

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "GlowManager", email: process.env.BREVO_SENDER_EMAIL ?? "noreply@glowmanager.app" },
        to: [{ email: to }],
        subject: "Test Brevo — GlowManager",
        htmlContent: "<p>Si ves este correo, Brevo funciona correctamente desde Railway.</p>",
      }),
    });
    const data = await res.json();
    if (!res.ok) return c.json({ ok: false, status: res.status, data }, 500);
    return c.json({ ok: true, data });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

// ─── POST /auth/forgot-password ──────────────────────────────────────────────
auth.post("/forgot-password", async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = body?.email?.trim()?.toLowerCase();
  if (!email) return c.json({ error: "El correo es requerido." }, 400);

  const user = await prisma.user.findUnique({ where: { email } });

  // Siempre respondemos igual para no revelar si el email existe
  if (!user) {
    return c.json({ ok: true });
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.user.update({
    where: { email },
    data: { passwordResetToken: token, passwordResetExpires: expires },
  });

  try {
    await sendPasswordResetEmail(email, token, user.name);
  } catch (err) {
    console.error("Error enviando email de recuperación:", err);
  }

  return c.json({ ok: true });
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────
auth.post("/reset-password", async (c) => {
  const body = await c.req.json().catch(() => null);
  const { token, password } = body ?? {};

  if (!token || !password || password.length < 6) {
    return c.json({ error: "Datos inválidos." }, 400);
  }

  const user = await prisma.user.findUnique({ where: { passwordResetToken: token } });

  if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    return c.json({ error: "El enlace no es válido o ha expirado." }, 400);
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return c.json({ ok: true });
});

export default auth;
