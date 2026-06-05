# Estado del Proyecto — GlowManager
**Fecha:** Junio 2026  
**Versión:** 1.1  
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, pagos y reportes desde una sola interfaz web. El sistema está orientado a dueños y recepcionistas que trabajan desde computadora.

**Estado actual:** ~85% del MVP completado. Todas las pantallas definidas en el documento de arquitectura están implementadas. Hay 6 PRs abiertos pendientes de merge en GitHub con mejoras recientes.

---

## 2. Stack Tecnológico

### Frontend
| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS v4 | 4.x |
| Design System | Material Design 3 (tokens CSS) | — |
| Fuente | Inter (Google Fonts) | — |
| Íconos | Lucide React | 1.x |
| Gestor de paquetes | pnpm (workspace) | — |

### Backend
| Capa | Tecnología |
|---|---|
| Runtime | Node.js (Bun compatible) |
| Framework | Hono.js |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Autenticación | JWT (token en localStorage) |

### Infraestructura
- **Frontend:** Vercel (planificado)
- **Backend:** Railway (planificado)
- **DB:** Supabase PostgreSQL (planificado)
- **Monorepo:** pnpm workspaces (`apps/web` + backend)

---

## 3. Arquitectura del Frontend

### Estructura de rutas (`apps/web/src/app/`)

```
(auth)/
  login/                  → AUTH-01: Login email + contraseña
  recuperar-contrasena/   → AUTH-02: Solicitar reset de contraseña
  resetear-contrasena/    → AUTH-03: Nueva contraseña con token

(onboarding)/
  onboarding/             → SETUP-01: Wizard 4 pasos (primera vez)

(dashboard)/
  dashboard/              → DASH-01: Resumen operativo + KPIs
  agenda/                 → CAL-01: Calendario Día/Semana/Mes
  nueva-cita/             → CAL-03: Modal nueva cita (cliente, servicio, slot)
  citas/[id]/             → CAL-02: Detalle de cita con estados
  citas/[id]/cobrar/      → CAL-04: Cierre de cita / registro de pago
  clientes/               → CLI-01: Directorio de clientes
  clientes/[id]/          → CLI-02: Perfil cliente (métricas + historial)
  clientes/nuevo/         → Formulario nuevo cliente
  colaboradores/          → STAFF-01: Lista de colaboradores
  colaboradores/[id]/     → STAFF-02: Perfil (horarios + servicios + ausencias)
  colaboradores/nuevo/    → Formulario nuevo colaborador
  servicios/              → SRV-01: Catálogo agrupado por categoría
  servicios/[id]/         → SRV-02: Editar servicio (NUEVO esta sesión)
  servicios/nuevo/        → SRV-02: Nuevo servicio
  reportes/               → RPT-01: Analytics con gráficos (solo OWNER)
  configuracion/          → CFG hub (solo OWNER)
  configuracion/negocio/  → CFG-01: Datos del negocio
  configuracion/agenda/   → CFG-02: Políticas y días de operación
  configuracion/usuarios/ → CFG-03: Gestión de usuarios del sistema (NUEVO)
  configuracion/whatsapp/ → CFG-04: Notificaciones WhatsApp
```

### Componentes globales
```
src/
  components/
    layout/
      sidebar.tsx         → Navegación lateral fija (256px) con filtro por rol
      top-bar.tsx         → Barra superior con búsqueda y toggle modo oscuro
    theme-provider.tsx    → Contexto de tema claro/oscuro (localStorage)
  hooks/
    use-role.ts           → Hook para leer el rol del usuario (OWNER/RECEPTIONIST/STAFF)
```

### Sistema de diseño
- Variables CSS de Material Design 3 definidas en `globals.css` bajo `@theme inline`
- Paleta oscura completa bajo selector `.dark`
- Clase `.dark` se aplica en `<html>` desde `ThemeProvider`
- Toggle Sol/Luna en la TopBar persiste preferencia en `localStorage`

---

## 4. Todo lo hecho en esta sesión

### Mejoras de UI / correcciones menores
| # | Descripción | Archivo |
|---|---|---|
| 1 | Modo oscuro completo (paleta MD3 dark + toggle Sol/Luna) | `globals.css`, `theme-provider.tsx`, `top-bar.tsx`, `layout.tsx` |
| 2 | Categoría personalizada en configuración del negocio | `configuracion/negocio/page.tsx` |
| 3 | Quitar placeholders del formulario de nuevo cliente (excepto Notas) | `clientes/nuevo/page.tsx` |
| 4 | Cambiar "catálogo de tu salón" → "catálogo de tu negocio" | `servicios/page.tsx` |
| 5 | Eliminar sección "Duración de Slots" (redundante con duración por servicio) | `configuracion/agenda/page.tsx` |

### GAPs del documento de arquitectura (v1.0)
| GAP | Descripción | PR |
|---|---|---|
| GAP 1 | Página de edición `/servicios/[id]` + campos `buffer_minutes` y `color` | [#5](https://github.com/rvsoslim020295/GeneradorCitas/pull/5) |
| GAP 2 | Horarios semanales editables por día + ausencias reales (sin mock) | [#6](https://github.com/rvsoslim020295/GeneradorCitas/pull/6) |
| GAP 3 | Página CFG-03: gestión de usuarios del sistema (crear, activar, eliminar) | [#7](https://github.com/rvsoslim020295/GeneradorCitas/pull/7) |
| GAP 4 | Protección de rutas por rol: Reportes y Configuración solo OWNER | [#8](https://github.com/rvsoslim020295/GeneradorCitas/pull/8) |

### Sugerencias de mejora implementadas
| Sug. | Descripción | PR |
|---|---|---|
| A | Editar nombre, apellidos, teléfono y email desde el perfil del cliente | [#9](https://github.com/rvsoslim020295/GeneradorCitas/pull/9) |
| B | Botón "Confirmar todas" en la sección de alertas del dashboard | [#10](https://github.com/rvsoslim020295/GeneradorCitas/pull/10) |

---

## 5. PRs abiertos (pendientes de merge)

| PR | Rama | Descripción |
|---|---|---|
| [#5](https://github.com/rvsoslim020295/GeneradorCitas/pull/5) | `feat/gap1-edicion-servicios` | Edición de servicios + buffer + color |
| [#6](https://github.com/rvsoslim020295/GeneradorCitas/pull/6) | `feat/gap2-horarios-colaborador` | Horarios editables y ausencias reales |
| [#7](https://github.com/rvsoslim020295/GeneradorCitas/pull/7) | `feat/gap3-usuarios-sistema` | Gestión de usuarios del sistema |
| [#8](https://github.com/rvsoslim020295/GeneradorCitas/pull/8) | `feat/gap4-proteccion-roles` | Protección de rutas por rol |
| [#9](https://github.com/rvsoslim020295/GeneradorCitas/pull/9) | `feat/sug-a-editar-cliente` | Editar datos de contacto del cliente |
| [#10](https://github.com/rvsoslim020295/GeneradorCitas/pull/10) | `feat/sug-b-confirmar-todas` | Botón "Confirmar todas" en dashboard |

> **Acción requerida:** Mergear todos desde GitHub antes de continuar con nuevas ramas.

---

## 6. Pantallas completadas vs documento de arquitectura

| ID | Pantalla | Estado |
|---|---|---|
| AUTH-01 | Login | ✅ |
| AUTH-02 | Recuperar contraseña | ✅ |
| AUTH-03 | Resetear contraseña | ✅ |
| SETUP-01 | Onboarding wizard 4 pasos | ✅ |
| DASH-01 | Dashboard ejecutivo con KPIs | ✅ |
| CAL-01 | Calendario Día / Semana / Mes | ✅ |
| CAL-02 | Detalle de cita con estados y acciones | ✅ |
| CAL-03 | Nueva cita (búsqueda cliente, slots, origen) | ✅ |
| CAL-04 | Cierre de cita / registro de pago | ✅ |
| CLI-01 | Directorio de clientes | ✅ |
| CLI-02 | Perfil cliente (historial + métricas + edición) | ✅ |
| STAFF-01 | Lista de colaboradores | ✅ |
| STAFF-02 | Perfil colaborador (horarios + servicios + ausencias) | ✅ |
| SRV-01 | Catálogo de servicios | ✅ |
| SRV-02 | Formulario nuevo / editar servicio | ✅ |
| RPT-01 | Analytics con gráficos (OWNER) | ✅ |
| CFG-01 | Datos del negocio | ✅ |
| CFG-02 | Agenda y políticas | ✅ |
| CFG-03 | Gestión de usuarios del sistema | ✅ |
| CFG-04 | Notificaciones WhatsApp | ✅ |
| SYS-01 | Notificaciones in-app | ⚠️ Campana visible, sin datos reales |
| SYS-02 | 404 | ✅ |
| SYS-03 | Error general | ✅ |

**Total: 22/23 implementadas (96%)**

---

## 7. Sugerencias pendientes de implementar

| Sug. | Descripción | Prioridad |
|---|---|---|
| C | Indicador visual de buffer en el calendario (zona sombreada post-cita) | Media |
| D | Buscador global funcional en el top-bar (clientes, citas, servicios) | Media |
| E | Subir foto/avatar del colaborador desde su perfil | Baja |

---

## 8. Deuda técnica y limitaciones conocidas

### Autenticación
- El token JWT se guarda en `localStorage` (no en `httpOnly cookie`). Es funcional pero menos seguro para producción.
- La protección de rutas por rol es solo client-side (lectura de `localStorage`). El backend debe validar el rol en cada endpoint.

### Estado global
- No hay gestión de estado global (sin Zustand ni TanStack Query). Todo se carga localmente por componente. A medida que el sistema crezca esto puede generar re-fetches innecesarios.

### Calendario
- Implementado desde cero (sin FullCalendar). Funciona bien para las 3 vistas, pero no tiene drag & drop de citas ni vista multi-recurso (columnas paralelas por colaborador en vista semana). El documento de arquitectura mencionaba FullCalendar para esa funcionalidad.

### Notificaciones in-app (SYS-01)
- La campana en el top-bar muestra "No tienes notificaciones nuevas". No está conectada a datos reales. Falta implementar el feed de notificaciones.

### Buscador global
- El input de búsqueda en el top-bar es solo decorativo. No ejecuta búsquedas.

### Responsividad
- El diseño está optimizado para desktop. No hay breakpoints responsivos para móvil. Pendiente como mejora futura.

### Horarios del colaborador
- Los inputs de hora se guardan como parte del PATCH de colaborador. Requiere que el backend acepte el campo `schedule` en el endpoint `/collaborators/:id`.

### Ausencias del colaborador
- La UI está lista. Requiere que el backend tenga los endpoints `GET/POST/DELETE /collaborators/:id/absences`.

---

## 9. Flujo de trabajo acordado

- **Una feature = un branch = un PR**
- Formato de ramas: `feat/nombre`, `fix/nombre`
- Los PRs se mergean desde GitHub antes de iniciar la siguiente rama
- El remote usa token de `gh auth` embebido en la URL (workaround por credenciales de Keychain)

---

## 10. Próximos pasos sugeridos

1. **Mergear los 6 PRs abiertos** en GitHub
2. Implementar **Sugerencia C** — buffer visual en el calendario
3. Implementar **Sugerencia D** — buscador global funcional
4. Implementar **Sugerencia E** — foto del colaborador
5. Conectar **notificaciones in-app** (SYS-01)
6. Evaluar **responsividad móvil** (hacer el layout adaptable)
7. Migrar token a `httpOnly cookie` para mayor seguridad en producción
