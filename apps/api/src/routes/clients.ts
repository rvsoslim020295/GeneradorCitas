import { Hono } from "hono";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { getLimits } from "../lib/plan-limits.js";

const clients = new Hono();

// Todas las rutas de clientes requieren autenticación
clients.use("*", requireAuth);

const createClientSchema = z.object({
  name: z.string().min(2),
  lastName: z.string().optional(),
  dni: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});

// ─── GET /clients ─────────────────────────────────────────────────────────────
// Lista todos los clientes del negocio autenticado
// Soporta búsqueda con ?search=texto (filtra por nombre o teléfono)
clients.get("/", async (c) => {
  const { businessId } = c.get("user");
  const search = c.req.query("search")?.trim() ?? "";

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const limits = getLimits(business?.plan ?? "BASIC");

  // Si el plan tiene límite de historial, solo mostrar clientes que hayan
  // tenido al menos una cita dentro del período permitido
  const historyFilter = limits.clientHistoryDays !== -1
    ? {
        appointments: {
          some: {
            businessId,
            startTime: { gte: new Date(Date.now() - limits.clientHistoryDays * 24 * 60 * 60 * 1000) },
          },
        },
      }
    : undefined;

  const data = await prisma.client.findMany({
    where: {
      businessId,
      ...historyFilter,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { totalVisits: "desc" },
  });

  return c.json(data);
});

// ─── GET /clients/:id ─────────────────────────────────────────────────────────
// Devuelve el cliente con su historial de citas y métricas calculadas
clients.get("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");

  const client = await prisma.client.findFirst({
    where: { id, businessId },
    include: {
      appointments: {
        include: {
          service: { select: { id: true, name: true, category: true } },
          collaborator: { select: { id: true, name: true, role: true } },
        },
        orderBy: { startTime: "desc" },
      },
    },
  });

  if (!client) return c.json({ error: "Cliente no encontrado" }, 404);

  // Calculamos servicio y colaborador más frecuente a partir del historial
  const completed = client.appointments.filter((a) => a.status === "COMPLETED");

  const serviceCount: Record<string, { name: string; count: number }> = {};
  const collabCount: Record<string, { name: string; count: number }> = {};

  for (const apt of completed) {
    const sid = apt.service.id;
    serviceCount[sid] = serviceCount[sid]
      ? { ...serviceCount[sid], count: serviceCount[sid].count + 1 }
      : { name: apt.service.name, count: 1 };

    const cid = apt.collaborator.id;
    collabCount[cid] = collabCount[cid]
      ? { ...collabCount[cid], count: collabCount[cid].count + 1 }
      : { name: apt.collaborator.name, count: 1 };
  }

  const topService = Object.values(serviceCount).sort((a, b) => b.count - a.count)[0] ?? null;
  const topCollab = Object.values(collabCount).sort((a, b) => b.count - a.count)[0] ?? null;

  return c.json({
    ...client,
    metrics: {
      topService: topService?.name ?? null,
      topCollaborator: topCollab?.name ?? null,
    },
  });
});

// ─── POST /clients ────────────────────────────────────────────────────────────
// Crea un nuevo cliente para el negocio autenticado
clients.post("/", async (c) => {
  const { businessId } = c.get("user");
  const body = await c.req.json().catch(() => null);
  const parsed = createClientSchema.safeParse(body);

  if (!parsed.success) {
    const fieldMessages: Record<string, string> = {
      name: "El nombre debe tener al menos 2 caracteres.",
      email: "El correo electrónico no tiene un formato válido.",
      phone: "El teléfono no tiene un formato válido.",
      dni: "El DNI no tiene un formato válido.",
    };
    const firstIssue = parsed.error.issues[0];
    const field = firstIssue?.path[0] as string | undefined;
    const message = (field && fieldMessages[field]) ?? "Revisa los datos ingresados e intenta de nuevo.";
    return c.json({ error: message }, 400);
  }

  // Detectar duplicados por teléfono o DNI dentro del mismo negocio
  const { phone, dni } = parsed.data;
  if (phone || dni) {
    const orConditions = [];
    if (phone) orConditions.push({ phone, businessId });
    if (dni)   orConditions.push({ dni, businessId });
    const duplicate = await prisma.client.findFirst({ where: { OR: orConditions } });
    if (duplicate) {
      const field = duplicate.phone === phone ? "teléfono" : "DNI";
      const fullName = [duplicate.name, duplicate.lastName].filter(Boolean).join(" ");
      return c.json({
        error: `Ya existe un cliente con ese ${field}: ${fullName}. Verifica si es un duplicado.`,
        duplicateId: duplicate.id,
      }, 409);
    }
  }

  let client;
  try {
    client = await prisma.client.create({
      data: { ...parsed.data, businessId },
    });
  } catch (err: unknown) {
    console.error("Error al crear cliente:", err);
    return c.json({ error: "No se pudo guardar el cliente. Intenta de nuevo." }, 500);
  }

  return c.json(client, 201);
});

// ─── PATCH /clients/:id ───────────────────────────────────────────────────────
// Actualiza datos de un cliente
clients.patch("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const existing = await prisma.client.findFirst({ where: { id, businessId } });
  if (!existing) return c.json({ error: "Cliente no encontrado" }, 404);

  const client = await prisma.client.update({
    where: { id },
    data: body,
  });

  return c.json(client);
});

// ─── DELETE /clients/:id ──────────────────────────────────────────────────────
// Elimina un cliente (solo si no tiene citas activas)
clients.delete("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");

  const existing = await prisma.client.findFirst({ where: { id, businessId } });
  if (!existing) return c.json({ error: "Cliente no encontrado" }, 404);

  const activeCitas = await prisma.appointment.count({
    where: { clientId: id, status: { in: ["PENDING", "CONFIRMED"] } },
  });
  if (activeCitas > 0) {
    return c.json({ error: `No se puede eliminar: tiene ${activeCitas} cita(s) activa(s) pendiente(s).` }, 409);
  }

  await prisma.client.delete({ where: { id } });
  return c.json({ ok: true });
});

export default clients;
