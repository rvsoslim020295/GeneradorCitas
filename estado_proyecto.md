# Estado del Proyecto — GlowManager
**Fecha:** 10 de Junio 2026
**Versión:** 13.0
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `main`

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas.

**Estado actual:** ✅ MVP en producción. Login, registro, verificación de email, onboarding, dashboard, clientes, servicios, colaboradores, agenda, reportes, paquetes operativos. Responsive para móvil implementado. Recuperación de contraseña funcional.

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

### Railway
```
Build:  pnpm exec prisma migrate deploy && pnpm exec prisma generate && pnpm --filter api run build
Start:  node /app/apps/api/dist/index.js
```

> ⚠️ **IMPORTANTE:** El Build Command de Railway debe incluir `prisma migrate deploy` al inicio para aplicar migraciones automáticamente. Si no está así, actualízalo en Railway → Settings → Build Command.

### Vercel
Auto-deploy en push a `main`. No requiere configuración adicional.

---

## 8. Todo lo resuelto en esta sesión (v13.x)

### 8.1 Emails — Migración de Gmail SMTP a Brevo
- **Causa:** Railway bloquea todos los puertos SMTP salientes
- **Fix:** Migración a Brevo API HTTP (fetch nativo, sin paquetes npm)
- **Diagnóstico:** Endpoint `/auth/test-email?to=EMAIL` para probar envíos

### 8.2 Logout no funcionaba
- **Causa:** Cookies seteadas con `SameSite=Lax` vía JS no se podían borrar con atributos distintos. El middleware interceptaba la navegación a `/login` y redirigía de vuelta.
- **Fix:** Ruta API `/api/logout` en Next.js que borra cookies server-side. Middleware excluye `/api/*` para no interferir.

### 8.3 Onboarding no guardaba datos del negocio
- **Causa:** `salon-profile-form.tsx` usaba `fetch` directo sin `Authorization` header
- **Fix:** Reemplazado por `apiFetch` que incluye el token automáticamente

### 8.4 Eliminar negocio en panel super admin
- **Nuevo:** Endpoint `DELETE /admin/businesses/:id` con borrado en cascada
- **Frontend:** Sección "Zona de peligro" con botón rojo y confirmación
- **Efecto:** El email queda libre para re-registrarse

### 8.5 Sidebar responsive en móvil
- **Nuevo:** Sidebar se oculta en móvil, aparece como overlay con botón hamburger ☰
- **Contexto:** `SidebarProvider` en layouts de `(dashboard)` y `(agenda)`
- **Cierre:** Se cierra automáticamente al navegar entre páginas

### 8.6 Responsive completo en páginas
- `md:ml-64` en todas las páginas (22 archivos corregidos)
- Búsquedas: `w-96` → `w-full md:w-96`
- Headers: `flex-wrap` en móvil, `px-4 md:px-6`
- Dashboard grid: `grid-cols-12` → `grid-cols-1 md:grid-cols-12`
- Stats: 2 columnas en móvil, 4 en desktop

### 8.7 Validaciones en Registro
- Teléfono: exactamente 9 dígitos numéricos (obligatorio)
- Correo: formato válido con regex (obligatorio)
- DNI y RUC: ahora **opcionales** (se pueden llenar en configuración después)
- Nombre, apellido, contraseña: obligatorios con mensajes específicos por campo
- Campos con error se marcan con borde rojo

### 8.8 Mensajes de error específicos en Login
- Correo no registrado → "No existe una cuenta con ese correo electrónico."
- Contraseña incorrecta → "Contraseña incorrecta. Inténtalo de nuevo."
- Backend devuelve `code: "EMAIL_NOT_FOUND"` y `code: "WRONG_PASSWORD"`

### 8.9 Validación profunda de correo en Registro
- **Capa 1:** Regex de formato
- **Capa 2:** Lista de 100k+ dominios desechables (paquete `disposable-email-domains`)
- **Capa 3:** Verificación de registros MX (dns nativo de Node.js)
- **Capa 4 (opcional):** UserCheck API — 1000/mes gratis, sin tarjeta (pendiente configurar)
- Variable: `USERCHECK_API_KEY` (opcional en `.env` y Railway)

### 8.10 Recuperación de contraseña
- **Nuevo flujo completo:** Solicitar → Email con link → Resetear
- Endpoint `POST /auth/forgot-password`: genera token, envía email, expira en 1 hora
- Endpoint `POST /auth/reset-password`: valida token, actualiza contraseña
- Páginas `/recuperar-contrasena` y `/resetear-contrasena` reescritas en español
- Token de reset guardado en BD: campos `passwordResetToken` y `passwordResetExpires`
- Indicadores visuales en tiempo real (longitud y coincidencia de contraseñas)
- Redirige automáticamente al login 3 segundos después de actualizar

### 8.11 Fix 500 en producción
- **Causa:** `createRequire` de `disposable-email-domains` fallaba en Railway (ESM)
- **Fix:** Cambio a `import disposableDomains from "disposable-email-domains"` (ESM nativo)

---

## 9. Estado de flujos en producción

| Flujo | Estado | Notas |
|---|---|---|
| Login usuario | ✅ | Mensajes de error específicos |
| Login super admin | ✅ | |
| Logout | ✅ | Vía `/api/logout` server-side |
| Registro | ✅ | Validaciones completas, DNI/RUC opcionales |
| Validación de email | ✅ | MX + desechables |
| Email verificación | ✅ | Brevo API HTTP |
| Recuperar contraseña | ✅ | Email con link, expira 1h |
| Onboarding negocio (4 pasos) | ✅ | Guarda datos correctamente |
| Dashboard | ✅ | Responsive móvil |
| Clientes | ✅ | CRUD completo, responsive |
| Colaboradores | ✅ | Especialidades desde servicios reales |
| Servicios | ✅ | CRUD completo |
| Agenda / Citas | ✅ | |
| Paquetes | ✅ | |
| Reportes | ✅ | |
| Banner trial | ✅ | Muestra días restantes en sidebar |
| Plan vencido | ✅ | Bloquea y redirige a /plan-vencido |
| Panel Super Admin | ✅ | Incluye eliminar negocio |
| Sidebar móvil | ✅ | Hamburger + overlay |
| Responsive general | ✅ | Todas las páginas adaptadas |

---

## 10. Bugs / Pendientes

### Crítico
| Item | Descripción |
|---|---|
| **Build Command Railway** | Verificar que incluya `prisma migrate deploy` para aplicar campos `passwordResetToken` y `passwordResetExpires` en producción |

### Media prioridad
| Item | Descripción |
|---|---|
| **UserCheck API** | Configurar `USERCHECK_API_KEY` en Railway para validación profunda de buzones (1000/mes gratis, sin tarjeta) → https://www.usercheck.com |
| **Onboarding saltado** | Usuarios verificados manualmente no configuran su negocio. Agregar redirect en dashboard si `business.name` está vacío |
| **Responsive avanzado** | Algunas páginas internas (detalles de cita, colaborador) pueden necesitar ajustes adicionales en pantallas muy pequeñas |

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

## 11. Comandos Útiles

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
```

---

## 12. Commits Clave de Esta Sesión

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
