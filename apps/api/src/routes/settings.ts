import { Hono } from "hono";
import { z } from "zod";
import { StorageClient } from "@supabase/storage-js";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";
const STORAGE_BUCKET = "logos";

function getStorage() {
  return new StorageClient(`${SUPABASE_URL}/storage/v1`, {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  });
}

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
    ruc: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().optional(),
    logoUrl: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const business = await prisma.business.update({
    where: { id: businessId },
    data: parsed.data,
  });

  return c.json(business);
});

// ─── POST /settings/logo ──────────────────────────────────────────────────────
// Recibe un archivo de imagen, lo sube a Supabase Storage y guarda la URL pública
settings.post("/logo", async (c) => {
  const { businessId } = c.get("user");

  const formData = await c.req.formData().catch(() => null);
  if (!formData) return c.json({ error: "FormData requerido" }, 400);

  const file = formData.get("logo");
  if (!file || typeof file === "string") return c.json({ error: "Archivo requerido" }, 400);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
  if (!allowed.includes(ext)) return c.json({ error: "Formato no permitido. Usa JPG, PNG o WebP." }, 400);

  if (file.size > 2 * 1024 * 1024) return c.json({ error: "El archivo no puede superar 2 MB." }, 400);

  const path = `${businessId}/logo.${ext}`;
  const buffer = await file.arrayBuffer();

  const storage = getStorage();
  const { error } = await storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) {
    console.error("Supabase Storage error:", error);
    return c.json({ error: "Error al subir el archivo." }, 500);
  }

  const { data: urlData } = storage.from(STORAGE_BUCKET).getPublicUrl(path);
  const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  await prisma.business.update({ where: { id: businessId }, data: { logoUrl } });

  return c.json({ logoUrl });
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
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
    waTplConfirmation: z.string().optional(),
    waTplReminder: z.string().optional(),
    waTplPayment: z.string().optional(),
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
