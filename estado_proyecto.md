# Estado del Proyecto — GlowManager
**Fecha:** 10 de Junio 2026
**Versión:** 14.1
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `main`

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas.

**Estado actual:** ✅ MVP en producción. Login, registro, verificación de email, onboarding, dashboard, clientes, servicios, colaboradores, agenda, reportes, paquetes operativos. Responsive completo para móvil implementado. Recuperación de contraseña funcional.

---

## 2. URLs de Producción

| Servicio | URL |
|---|---|
| **Frontend (Vercel)** | https://glowmanager-web.vercel.app |
| **Backend (Railway)** | https://generadorcitas-production.up.railway.app |
| **Base de datos** | Railway PostgreSQL (interno) |
| **Storage logos** | Supabase Storage — bucket `logos` |

---

## 3. Stack Tecnológico

### Frontend (`apps/web`)
| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 App Router |
| Lenguaje | TypeScript 5.x |
| Estilos | Tailwind CSS 4.x + Material Design 3 tokens |
| Data fetching | TanStack Query v5 |
| Íconos | Lucide React |
| Deploy | Vercel (auto-deploy en push a main) |

### Backend (`apps/api`)
| Capa | Tecnología |
|---|---|
| Framework | Hono.js |
| ORM | Prisma 6.x |
| Base de datos | PostgreSQL (Railway) |
| Auth | JWT — Authorization header + cookie fallback |
| Email | Brevo API HTTP (puerto 443 — Railway bloquea SMTP) |
| Storage | Supabase Storage (bucket `logos`) |
| Runtime | Node.js v22 |
| Deploy | Railway (auto-deploy en push a main) |

### Monorepo
```
GeneradorCitas/
├── apps/
│   ├── web/        ← Next.js (frontend)
│   └── api/        ← Hono.js (backend)
├── prisma/         ← Schema compartido
└── pnpm-workspace.yaml
```

---

## 4. Proveedores y Conexiones

| Proveedor | Uso | Conexión | Plan |
|---|---|---|---|
| **Vercel** | Frontend | Variable `NEXT_PUBLIC_API_URL` apunta a Railway | Gratis |
| **Railway** | Backend + PostgreSQL | `DATABASE_URL` interno | Hobby |
| **Brevo** | Emails transaccionales | API HTTP con `BREVO_API_KEY` | Gratis (300/día) |
| **Supabase** | Storage de logos | SDK con `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | Gratis |

> ⚠️ Railway bloquea todos los puertos SMTP salientes (25, 465, 587). Por eso se usa Brevo API HTTP.

---

## 5. Arquitectura de Auth

```
LOGIN:
  POST /auth/login → { token, user }
  → localStorage("gm_token") = token
  → document.cookie("gm_token") = token  ← para Next.js middleware
  → router.push("/dashboard")

REQUESTS:
  apiFetch("/ruta") → Authorization: Bearer <token>

LOGOUT:
  window.location.href = "/api/logout"
  → Next.js API route borra cookie server-side
  → redirect /login

NEXT.JS MIDDLEWARE:
  /api/* → bypass (no interferir)
  /admin/* → bypass (lógica propia)
  token && ruta pública → redirect /dashboard
  adminToken && ruta pública → redirect /admin/dashboard
  !token && ruta protegida → redirect /login

BACKEND:
  requireAuth → lee Authorization header || cookie "gm_token"
  requireSuperAdmin → lee Authorization header || cookie "gm_admin_token"
```

---

## 6. Variables de Entorno

### Railway (Producción)
| Variable | Descripción |
|---|---|
| `PORT` | `3000` |
| `DATABASE_URL` | PostgreSQL Railway (interno) |
| `JWT_SECRET` | Secret para JWT de usuarios |
| `ADMIN_JWT_SECRET` | Secret para JWT de super admin |
| `BREVO_API_KEY` | Ver en Railway → Variables (no almacenar en código) |
| `BREVO_SENDER_EMAIL` | `glowmanager95@gmail.com` |
| `BREVO_SENDER_NAME` | `GlowManager` |
| `APP_URL` | `https://glowmanager-web.vercel.app` |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Service key de Supabase |
| `NODE_ENV` | `production` |
| `TZ` | `America/Lima` |

### Local (`apps/api/.env`) — NO se sube a GitHub
| Variable | Valor local |
|---|---|
| `PORT` | `3001` |
| `DATABASE_URL` | PostgreSQL local |
| `APP_URL` | `http://localhost:3000` |
| `BREVO_API_KEY` | igual que producción |
| `BREVO_SENDER_EMAIL` | `glowmanager95@gmail.com` |

### Vercel (Producción)
| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://generadorcitas-production.up.railway.app` |

---

## 7. Build y Deploy

### Railway — Configuración correcta (v14.0)
```
Build Command:      pnpm exec prisma generate && pnpm --filter api run build
Pre-Deploy Command: pnpm exec prisma migrate deploy
Start Command:      node /app/apps/api/dist/index.js
```

> ⚠️ **IMPORTANTE:** `prisma migrate deploy` debe ir en **Pre-Deploy Command**, NO en Build Command.
> Railway no tiene acceso a la red privada (PostgreSQL) durante el build, solo durante pre-deploy.
> Si se pone en Build Command, el deploy falla con error de conexión.

### Vercel
Auto-deploy en push a `main`. No requiere configuración adicional.

---

## 8. Migraciones de Base de Datos

### Estado actual ✅
La BD de producción tiene historial de migraciones completo. Las 15 migraciones están aplicadas incluyendo `20260610_add_password_reset_fields`. El baseline se realizó manualmente en la Console de Railway el 10 de Junio 2026.

A partir de ahora, nuevas migraciones se aplican automáticamente vía **Pre-Deploy Command** en Railway al hacer push a `main`. No se requiere intervención manual.

---

## 9. Todo lo resuelto hasta v14.0

### v13.x (sesión anterior)
- Migración de emails a Brevo API HTTP
- Logout vía ruta Next.js server-side
- Onboarding guardaba datos correctamente
- Eliminar negocio en panel super admin
- Sidebar responsive con hamburger en móvil
- Responsive general en 22+ páginas (`md:ml-64`, headers, grids)
- Validaciones completas en registro (teléfono, email, DNI/RUC opcionales)
- Mensajes de error específicos en login (`EMAIL_NOT_FOUND`, `WRONG_PASSWORD`)
- Validación profunda de email (disposable + MX)
- Recuperación de contraseña completa (forgot → email → reset)

### v14.0 (sesión actual)

#### 9.1 Responsive avanzado en páginas de detalle
- **Reportes:** KPI de ingresos `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` (se veía aplastado en móvil). Header con `flex-wrap` para que el select y botón de exportar no se superpongan.
- **Colaboradores (editar):** Filas de horario laboral con `flex-wrap` y `flex-1` en inputs de hora — ya no se salen en pantallas < 400px.
- **Colaboradores (editar):** Grid Nombre/Apellido → `grid-cols-1 sm:grid-cols-2`. Padding lateral `px-4 md:px-6`.
- **Clientes (perfil):** Grids de edición de contacto y ficha técnica → `grid-cols-1 sm:grid-cols-2`. Padding `px-4 md:px-6`.
- **Agenda toolbar:** Eliminado `min-w-[220px]` del título de fecha que forzaba ancho. Padding y gaps responsivos.
- **Configuración negocio:** Grid RUC/Teléfono → `grid-cols-1 sm:grid-cols-2`.

#### 9.2 Fix Node.js v22.22.3 — ERR_IMPORT_ATTRIBUTE_MISSING
- **Causa:** Node.js v22.22.3 exige `with { type: "json" }` para importar JSON vía ESM. El paquete `disposable-email-domains` exporta un JSON puro (`index.json`) sin soporte para import attributes.
- **Fix:** En `email-validator.ts`, se reemplazó el `import` directo por `createRequire.resolve()` + `readFileSync` + `JSON.parse`. Así nunca pasa por el sistema de import ESM.
- **Archivo:** `apps/api/src/lib/email-validator.ts`

#### 9.3 Fix Railway — Build Command vs Pre-Deploy Command
- **Causa:** `prisma migrate deploy` necesita conectarse a PostgreSQL, pero Railway no tiene acceso a la red privada durante el **build** (solo durante pre-deploy y runtime).
- **Fix:** Mover `prisma migrate deploy` de Build Command a **Pre-Deploy Command**.
- **Build Command actual:** `pnpm exec prisma generate && pnpm --filter api run build`
- **Pre-Deploy Command:** `pnpm exec prisma migrate deploy`

#### 9.4 Baseline de migraciones pendiente
- La BD de producción no tiene historial de migraciones (`_prisma_migrations` vacío → error `P3005`).
- Pendiente correr el comando de baseline en Railway Console (ver sección 8).

---

## 10. Estado de flujos en producción

| Flujo | Estado | Notas |
|---|---|---|
| Login usuario | ✅ | Mensajes de error específicos |
| Login super admin | ✅ | |
| Logout | ✅ | Vía `/api/logout` server-side |
| Registro | ✅ | Validaciones completas, DNI/RUC opcionales |
| Validación de email | ✅ | MX + desechables (fix Node 22.22 incluido) |
| Email verificación | ✅ | Brevo API HTTP |
| Recuperar contraseña | ✅ | Email con link, expira 1h |
| Onboarding negocio (4 pasos) | ✅ | Guarda datos correctamente |
| Dashboard | ✅ | Responsive móvil |
| Clientes | ✅ | CRUD completo, responsive avanzado |
| Colaboradores | ✅ | Horario laboral responsive en móvil |
| Servicios | ✅ | CRUD completo |
| Agenda / Citas | ✅ | Toolbar responsive |
| Paquetes | ✅ | |
| Reportes | ✅ | KPIs responsivos en móvil |
| Banner trial | ✅ | Muestra días restantes en sidebar |
| Plan vencido | ✅ | Bloquea y redirige a /plan-vencido |
| Panel Super Admin | ✅ | Incluye eliminar negocio |
| Sidebar móvil | ✅ | Hamburger + overlay |
| Responsive general | ✅ | Todas las páginas adaptadas incluyendo detalles |

---

## 11. Bugs / Pendientes

### Media prioridad
| Item | Descripción |
|---|---|
| **UserCheck API** | Configurar `USERCHECK_API_KEY` en Railway para validación profunda de buzones (1000/mes gratis, sin tarjeta) → https://www.usercheck.com |
| **Onboarding saltado** | Usuarios verificados manualmente no configuran su negocio. Agregar redirect en dashboard si `business.name` está vacío |

### Baja prioridad
| Item | Descripción |
|---|---|
| **WhatsApp botón** | Enviar resumen de tratamiento al cliente vía wa.me |
| **Comisiones** | % sobre servicios por colaborador |
| **Foto de resultado** | Portafolio del negocio por cita |
| **Pagos automáticos (Culqi)** | Activación de plan es manual hoy |
| **Drag & drop en calendario** | Evaluar FullCalendar |
| **`audit_log`** | Trazabilidad de acciones críticas |

---

## 12. Comandos Útiles

```bash
# Dev local
pnpm --filter web dev       # Frontend :3000
pnpm --filter api dev       # Backend :3001

# Build
pnpm exec prisma generate && pnpm --filter api run build

# Test email en producción
curl "https://generadorcitas-production.up.railway.app/auth/test-email?to=TU_EMAIL"

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

# Baseline de migraciones (Railway Console — solo si hay error P3005)
for m in 20260604235632_init_auth 20260605001723_add_client 20260605002226_add_collaborator 20260605003106_add_service 20260605003755_add_appointment 20260605004840_add_payment_fields 20260605010104_add_business_settings 20260605010952_add_trial 20260605030403_add_client_lastname_dni 20260605142527_add_avatar_url_to_collaborator 20260605143343_fix_service_collaborator_fields 20260605152210_add_deposit_amount_to_appointment 20260605154104_add_collaborator_lastname_document 20260605154508_add_collaborator_phone; do pnpm exec prisma migrate resolve --applied $m; done && pnpm exec prisma migrate deploy
```

---

## 13. Commits Clave de Esta Sesión (v14.0)

| Commit | Descripción |
|---|---|
| `f66a568` | fix: responsive avanzado — grids, toolbar y horario en móvil |
| `5bc208a` | fix: leer disposable-email-domains con readFileSync — evita ERR_IMPORT_ATTRIBUTE_MISSING en Node 22.22 |

## 14. Commits Clave Históricos (v13.x)

| Commit | Descripción |
|---|---|
| `3dcfdf4` | debug: endpoint /auth/test-email para diagnosticar SMTP |
| `9ae243d` | fix: pre-resolver smtp.gmail.com a IPv4 con dns.lookup |
| `7e99a1d` | fix: migrar emails a Brevo API HTTP |
| `0563542` | docs: email verificación resuelto con Brevo |
| `a71d8c0` | fix: onboarding usa apiFetch + DELETE business en admin |
| `d9ad921` | fix: logout + sidebar responsive con hamburger |
| `f832db7` | fix: logout vía ruta API Next.js server-side |
| `eb69677` | fix: middleware excluye /api/, logout definitivo |
| `f7b6bf5` | feat: validación profunda email, mensajes login, DNI/RUC opcionales |
| `49a9f59` | fix: md:ml-64 en todas las páginas |
| `4ed389e` | feat: recuperar/resetear contraseña en español + funcional |
| `b09ac72` | fix: responsive completo — headers wrap, grids móvil |
| `43684d7` | fix: import ESM disposable-email-domains + migración password reset |
