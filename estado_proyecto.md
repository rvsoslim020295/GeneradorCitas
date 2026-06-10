# Estado del Proyecto — GlowManager
**Fecha:** 9 de Junio 2026
**Versión:** 12.1
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `main`

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** ✅ MVP 100% en producción y funcional. Login, registro, verificación de email, dashboard, clientes, servicios, colaboradores operativos. Emails vía Brevo API.

---

## 2. URLs de Producción

| Servicio | URL |
|---|---|
| **Frontend (Vercel)** | https://glowmanager-web.vercel.app |
| **Backend (Railway)** | https://generadorcitas-production.up.railway.app |
| **Base de datos** | Railway PostgreSQL (interno) |
| **Storage logos** | Supabase Storage — bucket `logos` |

---

## 3. Todo lo resuelto en esta sesión (v12.x)

### 3.1 Backend Railway no respondía (502)
- **Causa raíz:** Railway proxy apuntaba a puerto 3001, app escuchaba en 3000
- **Fix:** Variable `PORT=3000` + Railway Networking → Port 3000
- **Fix adicional:** `hostname: "0.0.0.0"` en `serve()` de Hono

### 3.2 CORS bloqueado
- **Causa:** middleware `hono/cors` no enviaba headers en Railway
- **Fix:** middleware CORS manual con headers explícitos + `app.options("*", ...)`

### 3.3 Prisma — dependencias de Prisma 7
- **Causa:** `@prisma/adapter-pg` y `@prisma/client-runtime-utils` (Prisma 7) incompatibles
- **Fix:** eliminados ambos paquetes, `PrismaClient()` estándar sin driver adapter

### 3.4 Auth cross-domain (cookie no funcionaba entre Vercel y Railway)
- **Causa:** cookies `SameSite=Lax` bloqueadas cross-domain; middleware Next.js verificaba cookie server-side sin acceso a localStorage
- **Fix completo:**
  1. Cookies cambiadas a `SameSite=None; Secure`
  2. Backend devuelve `token` en body del login y verify-email
  3. Frontend guarda token en `localStorage("gm_token")` + `document.cookie("gm_token")` para que el middleware de Next.js la lea
  4. `apiFetch` envía `Authorization: Bearer TOKEN` en todas las peticiones
  5. `requireSuperAdmin` middleware actualizado para aceptar Authorization header
  6. Sidebar corregido para usar `apiFetch` (enviaba `/auth/me` sin token)

### 3.5 SMTP bloqueado en Railway
- **Causa:** Railway bloquea puerto 587 (ETIMEDOUT) y resuelve smtp.gmail.com con IPv6 (ENETUNREACH)
- **Fix:** puerto 465 con SSL + `family: 4` para forzar IPv4
- **Variable Railway:** `SMTP_PORT=465`
- **Estado:** pendiente confirmar entrega real de emails de verificación

### 3.6 Registro colgado
- **Causa:** `sendVerificationEmail` sin timeout bloqueaba la respuesta indefinidamente
- **Fix:** `connectionTimeout: 10000` y `socketTimeout: 10000` en nodemailer

### 3.7 Clientes no aparecían en el listado
- **Causa:** `historyFilter` en `GET /clients` ocultaba clientes sin citas (bug de lógica — el filtro de historial no debe afectar visibilidad)
- **Fix:** eliminado `historyFilter` del listado de clientes

### 3.8 Especialidades de colaborador hardcodeadas
- **Causa:** lista `ALL_SPECIALTIES` con 20 valores hardcodeados en lugar de usar servicios reales
- **Fix:** `useServices()` en páginas de nuevo y edición de colaborador — ahora muestra los servicios que el negocio haya creado

### 3.9 Verificación de email no autenticaba al usuario
- **Causa:** `/auth/verify-email` no devolvía token en el body, frontend no seteaba cookie
- **Fix:** endpoint devuelve `{ token, user }`, frontend setea localStorage + cookie igual que el login

### 3.10 Banner de trial no aparecía
- **Causa:** sidebar hacía fetch directo a `/auth/me` sin `Authorization` header
- **Fix:** sidebar usa `apiFetch` que incluye el token automáticamente

---

## 4. Arquitectura Auth (v12.x)

```
LOGIN FLOW:
  POST /auth/login → { token, user }
  → localStorage("gm_token") = token
  → document.cookie("gm_token") = token   ← para Next.js middleware (server-side)
  → router.push("/dashboard")

REQUESTS:
  apiFetch("/cualquier-ruta")
  → Authorization: Bearer <localStorage("gm_token")>

NEXT.JS MIDDLEWARE (server-side):
  Lee cookies.get("gm_token")
  → Si existe: deja pasar
  → Si no: redirect /login

BACKEND MIDDLEWARES:
  requireAuth        → lee Authorization header || cookie "gm_token"
  requireSuperAdmin  → lee Authorization header || cookie "gm_admin_token"
```

---

## 5. Configuración Railway

| Variable | Valor |
|---|---|
| `PORT` | `3000` |
| `SMTP_PORT` | `465` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `NODE_ENV` | `production` |
| `TZ` | `America/Lima` |
| Railway Networking | Port `3000` |

**Build:** `pnpm exec prisma generate && pnpm --filter api run build`
**Start:** `node /app/apps/api/dist/index.js`

---

## 6. Configuración Vercel

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://generadorcitas-production.up.railway.app` |

---

## 7. Estado de flujos en producción

| Flujo | Estado | Notas |
|---|---|---|
| Login usuario | ✅ | Token en localStorage + cookie |
| Login super admin | ✅ | Mismo mecanismo |
| Registro | ✅ | Cuenta creada, email pendiente confirmar |
| Email verificación | ✅ | Brevo API HTTP — funciona en Railway |
| Onboarding negocio (4 pasos) | ✅ | Funciona después de verificar email |
| Dashboard | ✅ | Carga correctamente |
| Clientes | ✅ | CRUD completo, listado corregido |
| Colaboradores | ✅ | Especialidades desde servicios reales |
| Servicios | ✅ | CRUD completo |
| Agenda / Citas | ✅ | |
| Paquetes | ✅ | |
| Reportes | ✅ | |
| Banner trial | ✅ | Muestra días restantes en sidebar |
| Plan vencido | ✅ | Bloquea y redirige a /plan-vencido |
| Panel Super Admin | ✅ | |

---

## 8. Bugs / Deuda Técnica Pendiente

### Crítico
| Item | Descripción |
|---|---|
| ~~Emails de verificación~~ | ✅ Resuelto — migrado a Brevo API HTTP (Railway bloquea todos los puertos SMTP) |

### Media prioridad
| Item | Descripción |
|---|---|
| **Onboarding saltado manualmente** | Usuarios verificados via Console no configuran su negocio (nombre, tipo vacíos). Agregar aviso o redirect en dashboard si `business.name` está vacío |
| **WhatsApp botón en ficha técnica** | Enviar resumen de tratamiento al cliente vía wa.me |
| **Comisiones por colaborador** | % sobre servicios atendidos |
| **Foto de resultado por cita** | Portafolio del negocio |

### Baja prioridad
| Item | Descripción |
|---|---|
| **Pagos automáticos (Culqi)** | Activación de plan es manual hoy |
| **Drag & drop en calendario** | Evaluar FullCalendar |
| **Responsividad móvil** | Solo desktop |
| **`audit_log`** | Trazabilidad de acciones críticas |

---

## 9. Stack Tecnológico

### Frontend (`apps/web`)
| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 App Router |
| Lenguaje | TypeScript 5.x |
| Estilos | Tailwind CSS 4.x + Material Design 3 tokens |
| Data fetching | TanStack Query v5 |
| Íconos | Lucide React |

### Backend (`apps/api`)
| Capa | Tecnología |
|---|---|
| Framework | Hono.js |
| ORM | Prisma 6.x |
| Base de datos | PostgreSQL (Railway) |
| Auth | JWT — Authorization header + cookie fallback |
| Email | Nodemailer (Gmail SMTP, puerto 465 SSL, IPv4 forzado) |
| Storage | Supabase Storage (bucket `logos`) |
| Runtime | Node.js v22 |
| Scheduler | node-cron (recordatorios WhatsApp) |

---

## 10. Comandos útiles

```bash
# Dev local
pnpm --filter web dev       # :3000
pnpm --filter api dev       # :3001

# Build
pnpm exec prisma generate && pnpm --filter api run build

# Verificar usuario manualmente (Railway Console)
node -e "import('/app/apps/api/dist/lib/prisma.js').then(async ({default: p}) => {
  await p.user.updateMany({ where:{email:'EMAIL'}, data:{emailVerified:true} });
  console.log('verificado'); process.exit(0);
});"

# Obtener token de verificación (Railway Console)
node -e "import('/app/apps/api/dist/lib/prisma.js').then(async ({default: p}) => {
  const u = await p.user.findUnique({ where:{email:'EMAIL'}, select:{emailVerificationToken:true} });
  console.log('TOKEN:', u?.emailVerificationToken); process.exit(0);
});"

# Generar nuevo token de verificación (Railway Console)
node -e "import('/app/apps/api/dist/lib/prisma.js').then(async ({default: p}) => {
  const {randomBytes} = await import('crypto');
  const t = randomBytes(32).toString('hex');
  await p.user.update({ where:{email:'EMAIL'}, data:{emailVerified:false, emailVerificationToken:t} });
  console.log('TOKEN:',t); process.exit(0);
});"
```

---

## 11. Commits clave de esta sesión

| Commit | Descripción |
|---|---|
| `33e93c5` | fix: eliminar dependencias Prisma 7 |
| `7b70ae1` | fix: CORS manual con headers explícitos |
| `35bbdf9` | fix: servidor escucha en 0.0.0.0 |
| `b2d919c` | fix: auth por Authorization header |
| `795f40d` | fix: admin auth acepta Authorization header |
| `c2bb597` | fix: SMTP puerto 465 SSL |
| `a98e1a1` | fix: forzar IPv4 en SMTP |
| `ce0dde0` | fix: cookie JS para middleware Next.js |
| `9d0c60f` | fix: eliminar historyFilter del listado de clientes |
| `8aeaeaf` | fix: especialidades colaborador desde servicios reales |
| `05dd53d` | fix: verify-email devuelve token y frontend setea cookie |
| `075fe3d` | fix: sidebar usa apiFetch para /auth/me |
