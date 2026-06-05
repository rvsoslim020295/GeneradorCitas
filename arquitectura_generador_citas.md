# Documento de Arquitectura Técnica
## Sistema de Gestión de Citas — Panel Administrativo para Negocios de Belleza
**Versión:** 1.0  
**Fecha:** Junio 2026  
**Perfil del Sistema:** B2B · Solo administradores/recepcionistas · Sin app para cliente final

---

## Tabla de Contenidos

1. [Stack Tecnológico Recomendado](#1-stack-tecnológico-recomendado)
2. [Funcionalidades Esenciales Faltantes](#2-funcionalidades-esenciales-faltantes)
3. [Modelo de Datos](#3-modelo-de-datos)
4. [Listado de Pantallas del Frontend](#4-listado-de-pantallas-del-frontend)
5. [Lógica de Calendario y Prevención de Solapamientos](#5-lógica-de-calendario-y-prevención-de-solapamientos)
6. [Diagrama de Arquitectura General](#6-diagrama-de-arquitectura-general)

---

## 1. Stack Tecnológico Recomendado

### Criterios de Selección

Este es un sistema B2B de uso interno. Las prioridades son distintas a una app de consumo masivo:

- **Velocidad de desarrollo** sobre escala infinita (el equipo probablemente es pequeño)
- **Confiabilidad y mantenibilidad** sobre rendimiento extremo
- **Costo operativo bajo** en etapa temprana
- **UX de escritorio** como caso de uso principal (un recepcionista usa la computadora del local)

---

### 1.1 Frontend — Next.js 15 + TypeScript + Tailwind CSS

**Next.js 15** con App Router es la elección correcta incluso para un panel interno porque:
- El dashboard complejo (calendario, formularios, tablas) se beneficia del renderizado híbrido
- La estructura de rutas por carpetas mantiene el código organizado a medida que crece
- TypeScript es obligatorio en un sistema donde un error de tipo en fechas puede resultar en una cita duplicada

**Tailwind CSS + shadcn/ui:** Los componentes de shadcn/ui (Calendar, Dialog, Select, Table, Command) son exactamente los building blocks de este sistema. Evita meses de desarrollo de UI desde cero.

**Componente clave de calendario:** `@fullcalendar/react` — la librería más madura del ecosistema para vistas de agenda tipo Google Calendar. Soporta vista día/semana/mes, drag & drop de citas, y recursos (vista de múltiples colaboradores en columnas paralelas). Es la única librería en 2026 que cubre todos estos casos sin trabajo custom excesivo.

**Gestión de estado y datos:**
- **TanStack Query v5** — caché del servidor, revalidación automática, manejo de estados de carga/error
- **Zustand** — estado global liviano (usuario activo, negocio seleccionado, filtros de agenda)
- **React Hook Form + Zod** — formularios con validación tipada

---

### 1.2 Backend — Node.js + Hono.js

**Hono.js** sobre Express o Fastify porque:
- Sintaxis limpia, similar a Express pero con TypeScript nativo
- Middleware de validación integrado con Zod
- Soporte de Edge Runtime para futuro si se migra a Cloudflare Workers
- Ecosistema más moderno que Express en 2026

**Runtime:** Bun — instalación de dependencias 10x más rápida, TypeScript nativo sin configuración de transpilación adicional.

**Jobs en background:** BullMQ + Redis para recordatorios de citas, notificaciones y limpieza de datos expirados.

---

### 1.3 Base de Datos — PostgreSQL + Prisma ORM

Esta es la decisión más crítica del sistema y no admite debate.

**Por qué PostgreSQL y no otro:**
- Las citas son datos relacionales por naturaleza: colaborador ↔ servicio ↔ cliente ↔ horario
- `FOR UPDATE` y transacciones ACID son el mecanismo que previene la doble-reserva (ver Sección 5)
- El tipo nativo `tstzrange` (rango de timestamps con zona horaria) permite consultas de solapamiento con un solo operador `&&` en SQL
- Los índices GiST sobre rangos de tiempo hacen estas consultas eficientes con miles de citas

**Prisma ORM:**
- Genera tipos TypeScript automáticamente desde el esquema — si la DB cambia, el compilador avisa
- Migraciones versionadas en Git
- La API fluida evita SQL crudo en el 95% de los casos; para el 5% crítico (detección de solapamientos) se usa `$queryRaw` con la potencia completa de PostgreSQL

**Caché:** Redis (Upstash) para disponibilidad en tiempo real.

---

### 1.4 Autenticación — Clerk o Auth.js v5

Para un panel B2B con múltiples usuarios (dueño + recepcionistas), **Clerk** es la opción más rápida de implementar con calidad de producción:
- Gestión de organizaciones integrada (un "negocio" = una organización en Clerk)
- Roles y permisos por organización
- UI de login preconstruida y personalizable
- MFA (autenticación de dos factores) listo para activar

Alternativa si se prefiere más control: **Auth.js v5** (open source, self-hosted).

---

### 1.5 Infraestructura y Hosting

| Capa | Servicio | Plan Inicial | Justificación |
|---|---|---|---|
| Frontend | Vercel | Hobby → Pro | Deploy automático, SSL, CDN global |
| Backend API | Railway | Starter ($5/mes) | Soporte nativo Bun, variables de entorno, logs |
| Base de Datos | Supabase | Free → Pro | PostgreSQL gestionado + backups automáticos + Realtime |
| Redis / Jobs | Upstash | Free tier | BullMQ serverless, paga por uso |
| Emails | Resend | Free (3k/mes) | Confirmaciones y recordatorios |
| WhatsApp | Twilio o Meta Cloud API | Pay-as-you-go | Recordatorios salientes |
| Storage | Supabase Storage | Incluido | Fotos de perfil de colaboradores |

**Costo estimado MVP en producción: ~$20-40 USD/mes**

---

## 2. Funcionalidades Esenciales Faltantes

Basado en experiencia implementando sistemas similares, estos son los módulos que el 100% de los negocios de belleza necesitan pero frecuentemente se omiten en el diseño inicial:

---

### 2.1 🔴 Crítico — Sistema de Roles y Permisos

**Por qué:** El dueño y el recepcionista no deben tener el mismo acceso.

| Rol | Capacidades |
|---|---|
| **OWNER** (Dueño) | Acceso total: configuración del negocio, precios, reportes financieros, gestión de staff, exportar datos |
| **RECEPTIONIST** (Recepcionista) | Crear/editar/cancelar citas, ver agenda, registrar clientes. No puede ver reportes de ingresos ni cambiar precios |
| **STAFF** (Colaborador) | Solo ver su propia agenda del día. Sin acceso a datos de otros ni a configuración |

Sin esto, un empleado puede ver los ingresos del negocio o modificar precios accidentalmente.

---

### 2.2 🔴 Crítico — Estados Completos de la Cita

Las citas no son solo "reservada" o "cancelada". El ciclo de vida completo es:

```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
                   ↘ CANCELLED (con motivo)
                   ↘ NO_SHOW (cliente no llegó)
                   ↘ RESCHEDULED (vinculada a nueva cita)
```

`NO_SHOW` es particularmente valioso: permite al dueño identificar clientes que reservan y no llegan (patrón costoso para el negocio).

---

### 2.3 🔴 Crítico — Directorio de Clientes (CRM Básico)

Aunque no hay app para el cliente, el sistema debe recordar quiénes son. Beneficios concretos:

- Al registrar una nueva cita, el recepcionista escribe el nombre y el sistema autocompleta el teléfono
- El dueño puede ver cuántas veces vino cada cliente y cuánto ha gastado
- Identificar clientes frecuentes vs. nuevos
- Notas internas: "alérgica al esmalte X", "prefiere a María", "tiende a llegar 10 min tarde"

Campos mínimos: nombre, teléfono, email (opcional), notas internas, fecha de primera visita.

---

### 2.4 🟡 Importante — Registro de Pagos / Cierre de Cita

Al marcar una cita como COMPLETED, el sistema debe registrar:
- Monto cobrado (puede diferir del precio de lista por descuentos)
- Método de pago: efectivo, tarjeta, transferencia, Yape/Plin (para mercado peruano)
- Propina (opcional)

Esto convierte el sistema de agenda en el registro financiero del día, que es como el dueño mide si el negocio fue bien.

---

### 2.5 🟡 Importante — Dashboard de Analíticas Básicas

No es un módulo de reportes complejo. Con 5 métricas el dueño tiene lo que necesita:

1. **Citas hoy / esta semana / este mes** (volumen)
2. **Ingresos del período** (suma de citas completadas)
3. **Tasa de cancelación y no-shows** (% del total)
4. **Servicio más demandado** (para saber qué capacitar)
5. **Colaborador con más citas completadas** (para reconocimiento o evaluación)

---

### 2.6 🟡 Importante — Recordatorios Automáticos por WhatsApp

El mayor problema operativo de estos negocios es el no-show. La solución estándar es un mensaje automático 24h antes:

> "Hola [Nombre] 👋 Te recordamos tu cita en [Negocio] mañana [día] a las [hora] con [Colaborador]. Si necesitas cancelar o reagendar, comunícate al [teléfono]."

Implementación: cron job que corre cada hora, busca citas en las próximas 24-26 horas sin recordatorio enviado, y dispara el mensaje vía Twilio/Meta Cloud API.

---

### 2.7 🟡 Importante — Configuración de Horarios por Excepción

Además de los horarios semanales recurrentes, el sistema necesita manejar:
- **Días festivos** del negocio (cerrado el día de Navidad)
- **Ausencia puntual de colaborador** (María no viene el miércoles 15)
- **Horario especial** (el sábado 20 cerramos a las 15:00 en vez de las 19:00)

Sin esto, el sistema mostrará horarios disponibles en días que el negocio está cerrado.

---

### 2.8 🟢 Deseable — Tiempo de Buffer Entre Citas

Algunos servicios necesitan tiempo de preparación o limpieza entre cliente y cliente. Por ejemplo, después de un servicio de coloración, el colaborador necesita 15 minutos para limpiar. Agregar un campo `buffer_minutes` al servicio previene que el sistema agende citas consecutivas sin margen.

---

### 2.9 🟢 Deseable — Link de Reserva Público (Fase Futura)

Para cuando el negocio quiera que los clientes reserven solos. La arquitectura debe estar diseñada para soportarlo desde el inicio sin reescritura. Esto implica que el campo `customer_id` en `appointments` debe ser nullable en el MVP (cita manual sin cliente registrado en el sistema) y estar listo para recibir reservas externas.

---

## 3. Modelo de Datos

### 3.1 Diagrama de Relaciones

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│    users    │──────▶│    businesses    │──────▶│  services   │
│  (acceso al │  1:N  │  (el negocio)    │  1:N  │             │
│  dashboard) │       └──────────────────┘       └──────┬──────┘
└─────────────┘                │                        │
                               │ 1:N                    │ N:M
                       ┌───────▼──────┐         ┌──────▼──────────┐
                       │    staff     │◀────────▶│ staff_services  │
                       │(colaboradores│         └─────────────────┘
                       │  del negocio)│
                       └──────┬───────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
       ┌───────▼──────┐ ┌─────▼──────┐ ┌────▼────────┐
       │ availability │ │blocked_time│ │appointments │
       │ (horario     │ │(excepciones│ │  (citas)    │
       │  semanal)    │ │ y bloqueos)│ │             │
       └──────────────┘ └────────────┘ └──────┬──────┘
                                              │
                                    ┌─────────┼──────────┐
                                    │                    │
                            ┌───────▼──────┐   ┌────────▼────┐
                            │  customers   │   │  payments   │
                            │  (clientes   │   │  (registro  │
                            │   del CRM)   │   │  de cobros) │
                            └──────────────┘   └────────────┘
```

---

### 3.2 Esquema Detallado

#### Tabla: `users`
Personas con acceso al panel administrativo (dueños, recepcionistas, colaboradores con acceso limitado).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `business_id` | UUID FK → businesses | A qué negocio pertenece |
| `email` | VARCHAR UNIQUE | Login |
| `password_hash` | VARCHAR | bcrypt cost 12 |
| `full_name` | VARCHAR | — |
| `role` | ENUM: OWNER, RECEPTIONIST, STAFF | Control de acceso |
| `avatar_url` | VARCHAR NULL | — |
| `is_active` | BOOLEAN DEFAULT true | Deshabilitar sin borrar |
| `last_login_at` | TIMESTAMPTZ NULL | — |
| `created_at` | TIMESTAMPTZ | — |

---

#### Tabla: `businesses`
El negocio en sí. Un usuario OWNER puede tener uno (MVP) o varios (futuro multi-sede).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `name` | VARCHAR | "Barbería El Estilo" |
| `category` | ENUM: BARBERSHOP, NAIL_SALON, MAKEUP, SPA, BEAUTY_SALON, OTHER | — |
| `address` | VARCHAR NULL | — |
| `city` | VARCHAR | — |
| `country` | VARCHAR DEFAULT 'PE' | — |
| `phone` | VARCHAR NULL | WhatsApp del negocio |
| `timezone` | VARCHAR DEFAULT 'America/Lima' | **Crítico** para cálculo de horarios |
| `logo_url` | VARCHAR NULL | — |
| `slot_duration_minutes` | INT DEFAULT 15 | Granularidad del calendario (cada cuántos minutos hay un slot) |
| `cancellation_policy_hours` | INT DEFAULT 24 | Horas mínimas para cancelar |
| `is_active` | BOOLEAN DEFAULT true | — |
| `created_at` | TIMESTAMPTZ | — |

---

#### Tabla: `services`
Los servicios que ofrece el negocio.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `business_id` | UUID FK → businesses | — |
| `name` | VARCHAR | "Corte de cabello", "Manicure francesa" |
| `description` | TEXT NULL | — |
| `duration_minutes` | INT | Duración real del servicio |
| `buffer_minutes` | INT DEFAULT 0 | Tiempo de preparación/limpieza post-servicio |
| `price` | DECIMAL(10,2) | Precio de lista |
| `currency` | VARCHAR DEFAULT 'PEN' | — |
| `color` | VARCHAR DEFAULT '#3B82F6' | Color en el calendario para identificación visual |
| `is_active` | BOOLEAN DEFAULT true | — |
| `created_at` | TIMESTAMPTZ | — |

> **`buffer_minutes`:** si el servicio dura 60 min y tiene 15 min de buffer, el slot siguiente disponible es en 75 min, no en 60.

---

#### Tabla: `staff`
Los colaboradores del negocio. Un colaborador puede o no tener acceso al dashboard (user_id nullable).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `business_id` | UUID FK → businesses | — |
| `user_id` | UUID FK → users NULL | Si tiene acceso al dashboard |
| `full_name` | VARCHAR | Nombre que aparece en la agenda |
| `phone` | VARCHAR NULL | — |
| `avatar_url` | VARCHAR NULL | Foto en la agenda |
| `color` | VARCHAR DEFAULT '#10B981' | Color de sus citas en el calendario |
| `bio` | TEXT NULL | Especialidades |
| `is_active` | BOOLEAN DEFAULT true | — |
| `created_at` | TIMESTAMPTZ | — |

---

#### Tabla: `staff_services` (tabla puente N:M)
Qué servicios puede realizar cada colaborador. Permite también personalizar el precio por colaborador.

| Campo | Tipo | Notas |
|---|---|---|
| `staff_id` | UUID FK → staff | — |
| `service_id` | UUID FK → services | — |
| `custom_duration_minutes` | INT NULL | Si el colaborador tarda diferente al estándar |
| `custom_price` | DECIMAL(10,2) NULL | Si cobra diferente al precio de lista |
| PK compuesta | `(staff_id, service_id)` | — |

---

#### Tabla: `availability`
Horario semanal recurrente de cada colaborador.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `staff_id` | UUID FK → staff | — |
| `day_of_week` | SMALLINT | 0=Domingo, 1=Lunes … 6=Sábado |
| `start_time` | TIME | "09:00:00" |
| `end_time` | TIME | "18:00:00" |
| `is_working` | BOOLEAN DEFAULT true | Toggle para desactivar ese día |
| UNIQUE | `(staff_id, day_of_week)` | Un registro por día por colaborador |

---

#### Tabla: `blocked_times`
Excepciones y ausencias puntuales que anulan el horario recurrente.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `staff_id` | UUID FK → staff NULL | NULL = bloqueo de todo el negocio |
| `business_id` | UUID FK → businesses | — |
| `start_at` | TIMESTAMPTZ | Inicio del bloqueo |
| `end_at` | TIMESTAMPTZ | Fin del bloqueo |
| `reason` | VARCHAR NULL | "Vacaciones", "Feriado nacional", "Capacitación" |
| `is_full_day` | BOOLEAN DEFAULT false | Para marcar días completos fácilmente |
| `created_by` | UUID FK → users | Quién lo creó |
| `created_at` | TIMESTAMPTZ | — |

---

#### Tabla: `customers`
CRM básico. Los clientes del negocio, sin acceso al sistema.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `business_id` | UUID FK → businesses | — |
| `full_name` | VARCHAR | — |
| `phone` | VARCHAR NULL | Para recordatorios y búsqueda rápida |
| `email` | VARCHAR NULL | — |
| `notes` | TEXT NULL | Notas privadas del staff |
| `preferred_staff_id` | UUID FK → staff NULL | "Siempre pide a Carlos" |
| `visit_count` | INT DEFAULT 0 | Actualizado en cada cita completada |
| `total_spent` | DECIMAL(10,2) DEFAULT 0 | Actualizado en cada pago registrado |
| `first_visit_at` | TIMESTAMPTZ NULL | — |
| `last_visit_at` | TIMESTAMPTZ NULL | — |
| `created_at` | TIMESTAMPTZ | — |

---

#### Tabla: `appointments` ⭐ Tabla central del sistema

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `business_id` | UUID FK → businesses | — |
| `staff_id` | UUID FK → staff | Colaborador asignado |
| `service_id` | UUID FK → services | Servicio a realizar |
| `customer_id` | UUID FK → customers NULL | NULL si no se registró el cliente |
| `created_by` | UUID FK → users | Quién registró la cita |
| `start_at` | TIMESTAMPTZ | **Índice crítico** |
| `end_at` | TIMESTAMPTZ | Calculado: start_at + duration + buffer |
| `status` | ENUM: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED | — |
| `price_override` | DECIMAL(10,2) NULL | Si se cobra diferente al precio de lista |
| `notes` | TEXT NULL | Notas del cliente al agendar |
| `internal_notes` | TEXT NULL | Notas privadas del recepcionista |
| `cancellation_reason` | TEXT NULL | Motivo si status = CANCELLED |
| `reminder_sent_at` | TIMESTAMPTZ NULL | Para evitar enviar recordatorio dos veces |
| `source` | ENUM: MANUAL, WHATSAPP, PHONE, WALKIN, INSTAGRAM | De dónde llegó la cita |
| `rescheduled_from_id` | UUID FK → appointments NULL | Si es re-agendamiento, referencia a la original |
| `created_at` | TIMESTAMPTZ | — |
| `updated_at` | TIMESTAMPTZ | — |

**Índices críticos para rendimiento:**
```sql
CREATE INDEX idx_appointments_staff_time ON appointments (staff_id, start_at, end_at);
CREATE INDEX idx_appointments_business_date ON appointments (business_id, start_at);
CREATE INDEX idx_appointments_status ON appointments (status) WHERE status IN ('PENDING', 'CONFIRMED');
-- Índice GiST para consultas de solapamiento con tstzrange:
CREATE INDEX idx_appointments_range ON appointments USING GIST (tstzrange(start_at, end_at));
```

---

#### Tabla: `payments`
Registro del cobro al cerrar una cita.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `appointment_id` | UUID FK → appointments UNIQUE | Un pago por cita |
| `amount` | DECIMAL(10,2) | Monto cobrado |
| `tip` | DECIMAL(10,2) DEFAULT 0 | Propina |
| `method` | ENUM: CASH, CARD, TRANSFER, YAPE, PLIN, OTHER | — |
| `notes` | VARCHAR NULL | — |
| `created_by` | UUID FK → users | Quién registró el pago |
| `created_at` | TIMESTAMPTZ | — |

---

#### Tabla: `audit_log`
Registro inmutable de acciones críticas. Esencial para negocios donde múltiples personas tienen acceso.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `business_id` | UUID | — |
| `user_id` | UUID | Quién hizo la acción |
| `action` | VARCHAR | "appointment.created", "appointment.cancelled", "price.updated" |
| `entity_type` | VARCHAR | "appointment", "service", "staff" |
| `entity_id` | UUID | ID del objeto afectado |
| `old_value` | JSONB NULL | Estado anterior |
| `new_value` | JSONB NULL | Estado nuevo |
| `ip_address` | VARCHAR NULL | — |
| `created_at` | TIMESTAMPTZ | — |

---

## 4. Listado de Pantallas del Frontend

### 4.1 Autenticación

- **AUTH-01 — Login**  
  Email + contraseña. "Recordarme". Link a recuperación. Sin registro público (el dueño crea cuentas para su equipo desde el dashboard).

- **AUTH-02 — Recuperar Contraseña**  
  Input de email. Confirmación de envío.

- **AUTH-03 — Resetear Contraseña**  
  Nueva contraseña desde link en email. Token de un solo uso con expiración de 1 hora.

---

### 4.2 Onboarding (primera vez)

- **SETUP-01 — Configuración Inicial del Negocio**  
  Wizard de 4 pasos que aparece solo la primera vez. Paso 1: datos del negocio (nombre, categoría, ciudad). Paso 2: agregar servicios. Paso 3: agregar colaboradores. Paso 4: configurar horarios base. Sin completar el wizard, el sistema no permite agendar citas.

---

### 4.3 Dashboard Principal

- **DASH-01 — Home / Resumen Operativo**  
  La primera pantalla al hacer login. Muestra: número de citas del día por estado, próxima cita en los próximos 30 minutos (destacada), colaboradores activos hoy, ingresos del día (solo OWNER/RECEPTIONIST), alertas (citas sin confirmar, citas pasadas sin cierre). Diseñada para una lectura de 5 segundos.

---

### 4.4 Módulo de Agenda (Core)

- **CAL-01 — Calendario Principal**  
  Vista central del sistema. Tabs para cambiar entre: Vista Día, Vista Semana, Vista Mes. En Vista Día y Semana: columnas paralelas por colaborador (vista "recursos" de FullCalendar) — el recepcionista ve todos los colaboradores a la vez y puede identificar huecos de disponibilidad de un vistazo. Citas codificadas por color según servicio o colaborador (configurable). Click en un slot vacío → abre el formulario de nueva cita. Click en una cita existente → abre el panel de detalle.

- **CAL-02 — Panel de Detalle de Cita (modal/slide-over)**  
  Se abre al costado sin abandonar el calendario. Muestra: cliente, servicio, colaborador, hora, estado, notas, fuente. Botones de acción según estado actual (ver diagrama de estados en Sección 2). Historial de cambios de la cita. No es una pantalla separada — es un panel lateral para no perder el contexto del calendario.

- **CAL-03 — Formulario de Nueva / Editar Cita**  
  Modal o pantalla completa (configurable según preferencia del equipo). Campos: buscar o crear cliente (autocomplete por nombre/teléfono), seleccionar servicio, seleccionar colaborador, seleccionar fecha y hora. Al seleccionar colaborador + servicio + fecha, el sistema muestra en tiempo real los slots disponibles del día. Campo de notas. Campo "fuente" (WhatsApp, presencial, teléfono, Instagram). Validación en tiempo real antes de guardar.

- **CAL-04 — Cierre de Cita / Registro de Pago**  
  Se accede desde el detalle de la cita al hacer click en "Completar". Modal con: monto cobrado (pre-lleno con precio de lista, editable), propina, método de pago. Un solo click confirma el cierre y actualiza el estado a COMPLETED.

---

### 4.5 Gestión de Clientes (CRM)

- **CLI-01 — Directorio de Clientes**  
  Tabla paginada con búsqueda en tiempo real por nombre o teléfono. Columnas: nombre, teléfono, visitas, total gastado, última visita. Click en una fila → perfil del cliente. Botón "Nuevo cliente" en la esquina superior.

- **CLI-02 — Perfil del Cliente**  
  Datos de contacto + notas internas. Historial completo de citas (tabla con fecha, servicio, colaborador, monto, estado). Métricas rápidas: total de visitas, monto total gastado, servicio más frecuente, colaborador preferido (calculado desde el historial). Botón "Agendar cita" que abre el CAL-03 con el cliente pre-seleccionado.

---

### 4.6 Gestión de Colaboradores

- **STAFF-01 — Lista de Colaboradores**  
  Cards o tabla con foto, nombre, servicios que realiza, estado activo/inactivo. Botón "Agregar colaborador".

- **STAFF-02 — Perfil / Editar Colaborador**  
  Formulario con datos personales. Sección "Servicios que realiza": checkboxes de todos los servicios del negocio, con opción de personalizar precio y duración por colaborador. Sección "Horarios": selector por día de semana con hora inicio/fin y toggle de trabajo ese día. Sección "Bloqueos": lista de ausencias y días especiales con botón para agregar nuevo.

---

### 4.7 Gestión de Servicios

- **SRV-01 — Lista de Servicios**  
  Tabla con nombre, duración, buffer, precio y color. Toggle activo/inactivo. Botón "Nuevo servicio".

- **SRV-02 — Formulario Nuevo / Editar Servicio**  
  Modal con: nombre, descripción, duración (minutos), buffer post-servicio (minutos), precio, color en el calendario, imagen (opcional). Preview de cómo se verá en el calendario.

---

### 4.8 Analíticas (Solo OWNER)

- **RPT-01 — Dashboard de Analíticas**  
  Filtro de período: hoy, esta semana, este mes, rango personalizado. Métricas principales en tarjetas: total de citas, citas completadas, ingresos totales, tasa de no-show (%). Gráficos: citas por día del período (línea), ingresos por día (barras), distribución de métodos de pago (dona), top 5 servicios por frecuencia (barras horizontal), top 3 colaboradores por citas completadas. Sin exportación en MVP — agregar en siguiente iteración.

---

### 4.9 Configuración del Negocio (Solo OWNER)

- **CFG-01 — Datos Generales del Negocio**  
  Nombre, categoría, dirección, teléfono, zona horaria, logo.

- **CFG-02 — Configuración de Agenda**  
  Granularidad de slots (cada 15, 30 o 60 minutos), política de cancelación (horas mínimas), días de la semana en que opera el negocio.

- **CFG-03 — Gestión de Usuarios del Sistema**  
  Lista de usuarios con acceso al panel (dueño + recepcionistas). Crear nuevo usuario, cambiar rol, desactivar acceso. El dueño es el único que puede hacer esto.

- **CFG-04 — Configuración de Notificaciones**  
  Toggle para recordatorio automático por WhatsApp. Configurar cuántas horas antes se envía (default: 24h). Vista previa del mensaje. Botón "Enviar mensaje de prueba".

---

### 4.10 Pantallas del Sistema

- **SYS-01 — Notificaciones In-App**  
  Panel lateral: nueva cita registrada, cita cancelada, próximas citas del día.

- **SYS-02 — 404**  
  Página de ruta no encontrada.

- **SYS-03 — Error General**  
  Pantalla de error con botón de reintentar.

---

### Resumen de Pantallas

| Módulo | Pantallas | Acceso |
|---|---|---|
| Autenticación | 3 | Todos |
| Onboarding | 1 (wizard) | OWNER |
| Dashboard | 1 | Todos |
| Agenda (Core) | 4 | OWNER, RECEPTIONIST |
| Clientes / CRM | 2 | OWNER, RECEPTIONIST |
| Colaboradores | 2 | OWNER |
| Servicios | 2 | OWNER |
| Analíticas | 1 | OWNER |
| Configuración | 4 | OWNER |
| Sistema | 3 | Todos |
| **Total** | **23** | — |

---

## 5. Lógica de Calendario y Prevención de Solapamientos

Esta sección describe el mecanismo técnico más crítico del sistema. Un error aquí resulta en dos clientes citados al mismo colaborador a la misma hora, lo que destruye la confianza en el sistema.

---

### 5.1 Definición del Problema

Hay **dos tipos de solapamiento** que el sistema debe prevenir:

1. **Solapamiento directo:** Cita A (10:00–11:00) y Cita B (10:30–11:30) para el mismo colaborador.
2. **Solapamiento por buffer:** Cita A (10:00–11:00) con 15 min de buffer = bloqueo hasta 11:15. Cita B a las 11:10 solaparía el buffer.

Y **dos escenarios de entrada:**
1. **Consulta de disponibilidad:** el recepcionista pregunta "¿qué horas tiene disponible Carlos el jueves?"
2. **Intento de reserva:** el recepcionista confirma una cita en un slot específico.

---

### 5.2 Consulta de Disponibilidad (Paso 1 — Informativo)

Cuando el recepcionista selecciona colaborador + servicio + fecha en el formulario CAL-03, el frontend llama a:

```
GET /api/v1/availability/slots
  ?staffId=uuid
  &serviceId=uuid
  &date=2026-07-15
```

**Algoritmo en el backend:**

```
1. Obtener duración efectiva del servicio para este colaborador:
   duración = custom_duration ?? service.duration_minutes
   duración_total = duración + service.buffer_minutes

2. Obtener horario del colaborador para ese día de la semana:
   availability WHERE staff_id = X AND day_of_week = martes AND is_working = true
   → Si no existe o is_working = false: devolver [] (no trabaja ese día)

3. Verificar si hay bloqueo en ese día para el colaborador o para todo el negocio:
   blocked_times WHERE staff_id = X (o null) AND start_at <= fecha AND end_at >= fecha
   → Si hay bloqueo de día completo: devolver []

4. Obtener citas ya existentes ese día para ese colaborador:
   appointments WHERE staff_id = X
     AND status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
     AND start_at::date = fecha_solicitada

5. Generar todos los slots posibles del horario:
   desde availability.start_time hasta availability.end_time
   en intervalos de businesses.slot_duration_minutes (ej: cada 15 min)
   → [09:00, 09:15, 09:30, ..., 17:45]

6. Para cada slot candidato:
   slot_inicio = fecha + slot_hora
   slot_fin = slot_inicio + duración_total

   Verificar que slot_fin <= availability.end_time (no excede el horario)
   
   Verificar que NO existe ninguna cita existente que solape:
   ¿existe cita donde (cita.start_at, cita.end_at) se superpone con (slot_inicio, slot_fin)?
   Condición de solapamiento: cita.start_at < slot_fin AND cita.end_at > slot_inicio
   
   Verificar que el slot no caiga dentro de un bloqueo parcial del día
   
   Si pasa todas las verificaciones: marcar el slot como disponible

7. Devolver lista de slots disponibles (solo los libres):
   ["09:00", "09:30", "10:45", "11:15", ...]
```

Este cálculo puede ser cacheado en Redis con TTL de 60 segundos por `(staffId, date)`. El caché se invalida cuando se crea, modifica o cancela cualquier cita de ese colaborador en esa fecha.

---

### 5.3 Confirmación de Reserva (Paso 2 — Transacción Atómica)

Aquí está el mecanismo de seguridad real. La consulta de disponibilidad es orientativa, pero **la validación definitiva ocurre en la base de datos con un bloqueo de transacción**.

El problema a resolver: entre el momento en que el recepcionista ve un slot libre y el momento en que hace click en "Confirmar", otra persona (en otro turno, en otra computadora del local) podría haber reservado ese mismo slot.

**La solución — Transacción PostgreSQL con SELECT FOR UPDATE:**

```sql
BEGIN;

-- Paso 1: Bloquear las filas relevantes para este colaborador en ese rango de tiempo.
-- FOR UPDATE hace que cualquier otra transacción concurrente que intente
-- leer estas mismas filas tenga que ESPERAR hasta que esta transacción termine.
-- NOWAIT hace que falle inmediatamente si ya hay un lock (en vez de esperar).

SELECT id FROM appointments
WHERE staff_id = $staffId
  AND status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
  AND start_at < $endAt      -- la cita existente empieza antes de que termine la nueva
  AND end_at > $startAt      -- la cita existente termina después de que empieza la nueva
FOR UPDATE NOWAIT;

-- Paso 2: Evaluar el resultado
-- Si el SELECT devuelve ALGUNA fila → hay solapamiento
--   → ROLLBACK
--   → Devolver error HTTP 409 Conflict al cliente
--   → Mensaje: "El horario ya no está disponible. Por favor selecciona otro."

-- Si el SELECT devuelve 0 filas → el slot está libre
-- Paso 3: Insertar la nueva cita de forma segura
INSERT INTO appointments (
  id, business_id, staff_id, service_id, customer_id,
  start_at, end_at, status, source, created_by, created_at
) VALUES (
  gen_random_uuid(), $businessId, $staffId, $serviceId, $customerId,
  $startAt, $endAt, 'CONFIRMED', $source, $userId, NOW()
);

COMMIT;
-- En este punto la cita está creada y el lock liberado.
-- Cualquier transacción concurrente que estaba esperando
-- ahora leerá la fila recién insertada y fallará correctamente.
```

**¿Por qué esto funciona aunque lleguen dos requests al mismo tiempo?**

PostgreSQL garantiza que solo una transacción puede tener el `FOR UPDATE` lock sobre las mismas filas a la vez. Si dos requests llegan en el mismo milisegundo:
- La transacción A adquiere el lock, no encuentra solapamiento, inserta la cita, hace COMMIT
- La transacción B intenta adquirir el lock con NOWAIT, recibe un error de lock, hace ROLLBACK
- El recepcionista que usó B ve el mensaje "horario no disponible"

---

### 5.4 Regla de Validación Completa

La validación completa antes de insertar verifica estas condiciones en orden:

```
1. ¿El colaborador trabaja ese día de la semana? (availability)
2. ¿El horario solicitado está dentro de su horario laboral? (start_time / end_time)
3. ¿No hay un bloqueo de negocio o colaborador que cubra ese rango? (blocked_times)
4. ¿No hay solapamiento con otra cita activa? (SELECT FOR UPDATE)
5. ¿El colaborador está asignado a ese servicio? (staff_services)
6. ¿El negocio está activo? (businesses.is_active)
```

Si cualquier condición falla, se devuelve un error específico con el motivo exacto, para que el recepcionista pueda comunicárselo al cliente.

---

### 5.5 Diagrama de Flujo: Registrar una Nueva Cita

```
Recepcionista abre formulario
         │
         ▼
Selecciona colaborador + servicio + fecha
         │
         ▼ (llamada a /availability/slots)
Sistema muestra slots disponibles en tiempo real
         │
         ▼
Recepcionista elige slot y llena datos del cliente
         │
         ▼ (POST /appointments)
Backend inicia transacción PostgreSQL
         │
    ┌────▼────┐
    │ SELECT  │
    │FOR UPDATE│
    └────┬────┘
         │
    ¿Hay solapamiento?
    │              │
   SÍ             NO
    │              │
    ▼              ▼
ROLLBACK        INSERT appointment
HTTP 409        COMMIT
    │              │
    ▼              ▼
"Horario ya    Cita creada ✅
no disponible"  │
    │           ▼
    │     Encolar job:
    │     recordatorio WhatsApp
    │     24h antes
    │
    ▼
Recepcionista
elige otro slot
```

---

## 6. Diagrama de Arquitectura General

```
USUARIOS DEL SISTEMA
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│   Dueño      │  │  Recepcionista   │  │  Colaborador │
│  (OWNER)     │  │ (RECEPTIONIST)   │  │  (STAFF)     │
└──────┬───────┘  └────────┬─────────┘  └──────┬───────┘
       └─────────────────── ┼ ──────────────────┘
                            │ HTTPS (browser)
               ┌────────────▼────────────┐
               │       Vercel CDN        │
               │    Next.js 15 App       │
               │  - Dashboard / Agenda   │
               │  - FullCalendar         │
               │  - Módulos de gestión   │
               └────────────┬────────────┘
                            │ REST API / HTTPS
               ┌────────────▼────────────┐
               │    Railway (Backend)    │
               │    Hono.js + Bun        │
               │                        │
               │  Módulos:              │
               │  - Auth + RBAC         │
               │  - Appointments        │
               │  - Availability        │
               │  - Customers           │
               │  - Staff / Services    │
               │  - Notifications       │
               │  - Analytics           │
               └──┬──────────┬──────────┘
                  │          │
     ┌────────────▼┐    ┌────▼──────────┐
     │  Supabase   │    │ Upstash Redis │
     │  PostgreSQL │    │               │
     │             │    │ - Caché slots │
     │  - ACID txn │    │ - BullMQ jobs │
     │  - GiST idx │    └────┬──────────┘
     │  - Backups  │         │
     └─────────────┘    ┌────▼──────────────┐
                        │  Workers de Jobs  │
                        │                  │
                        │ - WhatsApp        │
                        │   (Twilio/Meta)   │
                        │ - Email (Resend)  │
                        │ - Cron reminders  │
                        └───────────────────┘
```

---

*Documento preparado para uso en diseño UI/UX y desarrollo. Versión 1.0 — Sistema B2B de gestión interna para negocios de belleza.*
