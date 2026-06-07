# Historias de Usuario — GlowManager
**Proyecto:** GlowManager — Panel de gestión para negocios de belleza  
**Versión:** 2.0  
**Fecha:** Junio 2026  
**Roles del sistema:** Dueño (OWNER), Recepcionista (COLLABORATOR), Administrador (ADMIN)

---

## Índice

1. [Autenticación y Cuenta](#1-autenticación-y-cuenta)
2. [Onboarding](#2-onboarding)
3. [Dashboard](#3-dashboard)
4. [Gestión de Citas](#4-gestión-de-citas)
5. [Gestión de Clientes](#5-gestión-de-clientes)
6. [Gestión de Colaboradores](#6-gestión-de-colaboradores)
7. [Gestión de Servicios](#7-gestión-de-servicios)
8. [Reportes y Analíticas](#8-reportes-y-analíticas)
9. [Configuración del Negocio](#9-configuración-del-negocio)
10. [Notificaciones](#10-notificaciones)

---

## 1. Autenticación y Cuenta

---

### HU-01 — Registro de nuevo negocio

**Como** dueño de un negocio de belleza,  
**quiero** crear una cuenta en GlowManager proporcionando mis datos personales y fiscales,  
**para** acceder al sistema y gestionar mi negocio.

**Criterios de aceptación:**
- El formulario solicita: Nombres, Apellidos, DNI (8 dígitos), RUC (11 dígitos), Número de teléfono, Correo electrónico y Contraseña (mínimo 6 caracteres).
- El DNI debe tener exactamente 8 dígitos numéricos.
- El RUC debe tener exactamente 11 dígitos numéricos.
- El correo no puede estar previamente registrado en el sistema.
- Ningún campo acepta placeholder ni datos precargados.
- Al completar el registro, se envía un correo de verificación a la dirección proporcionada.
- El sistema redirige a la pantalla "Verifica tu correo" indicando el email destino.
- La cuenta NO puede utilizarse hasta verificar el correo.

**Prioridad:** Alta | **Módulo:** Autenticación | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Registro exitoso con datos válidos**
- **Dado que** el usuario se encuentra en la página `/registro` y completa todos los campos con datos válidos (Nombres: "Ana", Apellidos: "García", DNI: "12345678", RUC: "12345678901", Teléfono: "987654321", Email: "ana@negocio.com", Contraseña: "segura123")
- **El sistema** valida que el correo no existe, hashea la contraseña, crea el negocio y el usuario en una transacción atómica, genera un token de verificación de 64 caracteres y lo almacena en la base de datos, y envía un correo de verificación al email proporcionado
- **Resultado** el usuario es redirigido a `/verificar-correo?email=ana@negocio.com` donde ve la pantalla de confirmación indicando que el enlace fue enviado a su correo

**Escenario 2 — Registro con correo ya existente**
- **Dado que** el usuario intenta registrarse con un correo que ya existe en la base de datos
- **El sistema** detecta el duplicado en la validación, no crea ningún registro y responde con error 409
- **Resultado** el usuario ve el mensaje "Este email ya está registrado" en el formulario y puede intentar con otro correo o ir al login

**Escenario 3 — Registro con DNI inválido**
- **Dado que** el usuario ingresa un DNI con menos de 8 dígitos o con caracteres no numéricos
- **El sistema** detecta que el patrón `\d{8}` no se cumple y bloquea el envío del formulario mediante validación HTML5
- **Resultado** el campo DNI muestra error de validación nativa del navegador y no se realiza ninguna petición al servidor

**Escenario 4 — Registro con RUC inválido (diferente de 11 dígitos)**
- **Dado que** el usuario ingresa un RUC con 10 dígitos o 12 dígitos
- **El sistema** valida en el frontend que el patrón `\d{11}` no se cumple, y adicionalmente el backend valida `z.string().min(11).max(11)`, rechazando la petición con error 400
- **Resultado** el formulario no se envía o el servidor retorna error de validación con detalle del campo inválido

**Escenario 5 — Registro con contraseña menor a 6 caracteres**
- **Dado que** el usuario ingresa una contraseña de 5 caracteres o menos
- **El sistema** valida mediante `minLength={6}` en el input y `z.string().min(6)` en el backend
- **Resultado** el formulario no se envía hasta que la contraseña cumpla el mínimo requerido

**Escenario 6 — Fallo de conexión con el servidor**
- **Dado que** el usuario completa el formulario correctamente pero el servidor API no está disponible
- **El sistema** captura el error de red en el bloque `catch` del fetch
- **Resultado** el usuario ve el mensaje "No se pudo conectar con el servidor" y el botón vuelve a estar habilitado para reintentar

---

### HU-02 — Verificación de correo electrónico

**Como** nuevo usuario registrado,  
**quiero** verificar mi correo electrónico haciendo clic en el enlace que me enviaron,  
**para** activar mi cuenta y comenzar a usar el sistema.

**Criterios de aceptación:**
- El enlace contiene un token único de 64 caracteres hexadecimales.
- Al verificar, el token se invalida y `emailVerified` se marca como `true`.
- Tras la verificación, el sistema genera un JWT y redirige al onboarding.
- El enlace caduca en 24 horas.

**Prioridad:** Alta | **Módulo:** Autenticación | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Verificación exitosa con token válido**
- **Dado que** el usuario hace clic en el enlace de verificación con un token válido y no expirado (`/verificar-email?token=abc123...`)
- **El sistema** busca el usuario con ese token, actualiza `emailVerified = true`, elimina el `emailVerificationToken`, genera un JWT de 7 días y lo retorna junto con los datos del usuario
- **Resultado** el frontend almacena el JWT en localStorage, muestra la pantalla de éxito "¡Cuenta verificada!" y tras 2 segundos redirige automáticamente a `/onboarding`

**Escenario 2 — Token ya utilizado**
- **Dado que** el usuario intenta acceder al enlace de verificación con un token que ya fue usado anteriormente
- **El sistema** no encuentra ningún usuario con ese `emailVerificationToken` (fue limpiado al verificar) y retorna error 400
- **Resultado** el usuario ve la pantalla de error "Enlace inválido" con el mensaje "Token inválido o ya utilizado" y un botón para volver al registro

**Escenario 3 — Token inexistente o malformado**
- **Dado que** el usuario accede a `/verificar-email` con un token inventado o modificado
- **El sistema** no encuentra ningún usuario con ese token y retorna error 400
- **Resultado** el usuario ve la pantalla de error con opción de volver al registro

**Escenario 4 — Acceso sin token en la URL**
- **Dado que** el usuario accede a `/verificar-email` sin el parámetro `token` en la URL
- **El sistema** detecta que `token` es `null` en los query params y pasa directamente al estado de error sin llamar al API
- **Resultado** el usuario ve el mensaje "Token de verificación no encontrado"

**Escenario 5 — Pantalla de espera de verificación**
- **Dado que** el usuario acaba de registrarse y fue redirigido a `/verificar-correo`
- **El sistema** muestra la pantalla estática con el email del destinatario, instrucciones de revisión de spam y el enlace "Iniciar sesión" para cuando ya verificó
- **Resultado** el usuario sabe exactamente qué correo revisar y qué hacer si no llega el correo

---

### HU-03 — Inicio de sesión

**Como** usuario registrado y verificado,  
**quiero** iniciar sesión con mi correo y contraseña,  
**para** acceder al panel de gestión de mi negocio.

**Criterios de aceptación:**
- El formulario no muestra datos precargados.
- Si el email no está verificado, retorna error 403 con mensaje específico.
- El JWT tiene vigencia de 7 días.

**Prioridad:** Alta | **Módulo:** Autenticación | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Login exitoso**
- **Dado que** el usuario ingresa un correo y contraseña correctos correspondientes a una cuenta con `emailVerified = true`
- **El sistema** verifica las credenciales con bcrypt, genera un JWT firmado con la clave secreta que incluye `userId`, `email`, `businessId` y `role`, y retorna el token junto con los datos del usuario y del negocio
- **Resultado** el JWT se almacena en `localStorage` bajo la clave `gm_token`, los datos del usuario bajo `gm_user`, y el usuario es redirigido a `/dashboard`

**Escenario 2 — Credenciales incorrectas**
- **Dado que** el usuario ingresa un correo que no existe en el sistema, o una contraseña incorrecta para un correo válido
- **El sistema** retorna error 401 con el mensaje genérico "Credenciales incorrectas" sin revelar si el email existe o no
- **Resultado** el usuario ve el mensaje de error en el formulario y puede intentar nuevamente

**Escenario 3 — Login con correo no verificado**
- **Dado que** el usuario intenta iniciar sesión con credenciales correctas pero `emailVerified = false`
- **El sistema** detecta la condición antes de generar el JWT y retorna error 403
- **Resultado** el usuario ve el mensaje "Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada" y puede ir a buscar el correo de verificación

**Escenario 4 — Sesión expirada**
- **Dado que** el usuario tiene un JWT almacenado que ya caducó (más de 7 días)
- **El sistema** detecta el JWT expirado en el middleware `requireAuth` y retorna error 401
- **Resultado** el cliente (`apiFetch`) redirige automáticamente a `/login` al detectar el 401

---

### HU-04 — Recuperación de contraseña

**Como** usuario que olvidó su contraseña,  
**quiero** solicitar un enlace de recuperación a mi correo,  
**para** restablecer mi contraseña y recuperar el acceso.

**Criterios de aceptación:**
- No se revela si el correo existe en el sistema.
- La nueva contraseña debe tener mínimo 6 caracteres.
- El enlace caduca en 24 horas.

**Prioridad:** Alta | **Módulo:** Autenticación | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Solicitud de recuperación con correo registrado**
- **Dado que** el usuario ingresa su correo en el formulario de recuperación y el correo existe en la base de datos
- **El sistema** genera un token de recuperación, lo almacena con fecha de expiración y envía el correo con el enlace de restablecimiento
- **Resultado** el usuario ve el mensaje "Si el correo existe, recibirás un enlace en breve" y recibe el correo en su bandeja

**Escenario 2 — Solicitud con correo no registrado**
- **Dado que** el usuario ingresa un correo que no existe en la base de datos
- **El sistema** no realiza ninguna acción pero retorna la misma respuesta genérica para no revelar si el email existe
- **Resultado** el usuario ve el mismo mensaje de confirmación y no puede determinar si el correo está registrado

**Escenario 3 — Restablecimiento con nueva contraseña válida**
- **Dado que** el usuario accede al enlace de restablecimiento con token válido e ingresa una nueva contraseña de al menos 6 caracteres
- **El sistema** valida el token, hashea la nueva contraseña con bcrypt e invalida el token de recuperación
- **Resultado** la contraseña queda actualizada, el usuario puede iniciar sesión con la nueva contraseña

**Escenario 4 — Enlace de recuperación expirado**
- **Dado que** el usuario accede al enlace de recuperación después de 24 horas de haber sido generado
- **El sistema** detecta que el token está expirado y lo rechaza
- **Resultado** el usuario ve el mensaje "El enlace ha expirado. Solicita uno nuevo" con opción de volver a recuperar contraseña

---

### HU-05 — Cierre de sesión

**Como** usuario autenticado,  
**quiero** cerrar mi sesión de manera segura,  
**para** proteger el acceso a mi cuenta en dispositivos compartidos.

**Criterios de aceptación:**
- Se eliminan el token y datos del usuario del localStorage.
- El sistema redirige al login.

**Prioridad:** Media | **Módulo:** Autenticación | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Cierre de sesión exitoso**
- **Dado que** el usuario autenticado hace clic en la opción "Cerrar sesión" del menú
- **El sistema** elimina `gm_token` y `gm_user` del localStorage del navegador
- **Resultado** el usuario es redirigido a `/login` y al intentar acceder a cualquier ruta protegida es nuevamente redirigido al login

**Escenario 2 — Intento de acceso tras cerrar sesión**
- **Dado que** el usuario cerró sesión y el navegador tiene el historial de la página del dashboard
- **El sistema** detecta la ausencia del JWT al intentar cargar los datos y retorna 401
- **Resultado** el middleware de `apiFetch` redirige automáticamente a `/login` sin mostrar datos del panel

---

## 2. Onboarding

---

### HU-06 — Configuración del perfil del negocio (Paso 1)

**Como** nuevo dueño que acaba de verificar su correo,  
**quiero** ingresar el nombre y tipo de mi negocio,  
**para** personalizar el sistema con la identidad de mi negocio.

**Criterios de aceptación:**
- Solicita nombre del negocio y tipo (Peluquería/Salón, Barbería, Spa, Nail Bar, Otro).
- Los datos se guardan mediante PATCH `/settings/business`.

**Prioridad:** Alta | **Módulo:** Onboarding | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Configuración del negocio exitosa**
- **Dado que** el usuario recién verificado ingresa el nombre "Studio Elegance" y selecciona el tipo "Peluquería / Salón de Belleza"
- **El sistema** envía PATCH `/settings/business` con el token JWT en el header de autorización y actualiza los campos `name` y `type` del negocio en la base de datos
- **Resultado** el usuario avanza al Paso 2 del onboarding y el nombre del negocio quedará visible en el dashboard y en la card de bienvenida

**Escenario 2 — Intento de avanzar sin seleccionar tipo de negocio**
- **Dado que** el usuario ingresa el nombre pero no selecciona ningún tipo de negocio
- **El sistema** detecta que el campo `businessType` está vacío y muestra el mensaje "Selecciona el tipo de negocio"
- **Resultado** el formulario no avanza al siguiente paso hasta que se seleccione un tipo

**Escenario 3 — Fallo silencioso al guardar**
- **Dado que** el servidor no responde al PATCH `/settings/business` (error de red)
- **El sistema** captura el error silenciosamente en el bloque `catch` y avanza al paso siguiente de todas formas
- **Resultado** el usuario continúa el onboarding; el nombre del negocio podrá configurarse más tarde en Configuración → Datos del negocio

---

### HU-07 — Configuración de días de atención (Paso 2)

**Como** nuevo dueño en el proceso de onboarding,  
**quiero** seleccionar los días en que mi negocio atiende,  
**para** que el calendario solo muestre disponibilidad en esos días.

**Criterios de aceptación:**
- Por defecto seleccionados Lun–Vie.
- No solicita duración de citas.
- Datos guardados en `/settings/agenda`.

**Prioridad:** Alta | **Módulo:** Onboarding | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Selección de días y avance exitoso**
- **Dado que** el usuario tiene seleccionados los días Lun–Sáb y hace clic en "Continuar"
- **El sistema** envía PATCH `/settings/agenda` con `{ operatingDays: ["Mon","Tue","Wed","Thu","Fri","Sat"], cancellationHours: 24 }` y avanza al paso 3
- **Resultado** los días quedan guardados y el calendario solo mostrará esos días como operativos

**Escenario 2 — Intento de avanzar sin ningún día seleccionado**
- **Dado que** el usuario deselecciona todos los días
- **El sistema** mantiene el botón "Continuar" deshabilitado mientras `operatingDays.length === 0`
- **Resultado** el usuario no puede avanzar hasta seleccionar al menos un día de operación

**Escenario 3 — Deselección y reselección de días**
- **Dado que** el usuario alterna entre seleccionar y deseleccionar días
- **El sistema** actualiza el estado local en tiempo real resaltando los días activos con el color primario
- **Resultado** el usuario ve de forma inmediata y clara cuáles días están seleccionados antes de guardar

---

### HU-08 — Registro del primer servicio (Paso 3)

**Como** nuevo dueño en el proceso de onboarding,  
**quiero** registrar el primer servicio de mi catálogo,  
**para** empezar a recibir citas desde el primer día.

**Criterios de aceptación:**
- Solicita nombre, precio y duración del servicio.
- Se envía con `category: "General"` por defecto.
- Incluye opción "Agregar después".

**Prioridad:** Alta | **Módulo:** Onboarding | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Registro del primer servicio exitoso**
- **Dado que** el usuario ingresa nombre "Corte de cabello", precio "35" y duración "30 min"
- **El sistema** envía POST `/services` con `{ name: "Corte de cabello", price: 35, durationMin: 30, category: "General" }` usando el JWT del usuario
- **Resultado** el servicio queda creado en la base de datos y aparecerá en el catálogo de servicios al ingresar al sistema; el usuario avanza al paso 4

**Escenario 2 — Intento de continuar sin nombre o precio**
- **Dado que** el usuario deja el campo nombre o precio vacíos
- **El sistema** mantiene el botón "Continuar" deshabilitado (`disabled={!name || !price}`)
- **Resultado** el usuario no puede avanzar hasta completar los campos obligatorios

**Escenario 3 — Saltar el paso con "Agregar después"**
- **Dado que** el usuario hace clic en "Agregar después"
- **El sistema** no realiza ninguna petición al servidor y avanza directamente al paso 4
- **Resultado** el usuario llega al onboarding completo sin ningún servicio creado; podrá añadirlos desde Configuración → Servicios

**Escenario 4 — Fallo en la creación del servicio**
- **Dado que** el servidor retorna un error al intentar crear el servicio
- **El sistema** captura el error silenciosamente y avanza al paso 4 de todas formas
- **Resultado** el usuario no ve un error bloqueante; el servicio podrá crearse manualmente desde el catálogo

---

### HU-09 — Pantalla de confirmación de onboarding (Paso 4)

**Como** nuevo dueño que completó la configuración inicial,  
**quiero** ver una pantalla de confirmación al terminar el onboarding,  
**para** saber que mi negocio está listo para operar.

**Criterios de aceptación:**
- Muestra un resumen y botón para ingresar al dashboard.

**Prioridad:** Media | **Módulo:** Onboarding | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Visualización de la pantalla de éxito**
- **Dado que** el usuario completó los 3 pasos anteriores del onboarding
- **El sistema** renderiza el componente `StepListo` mostrando un mensaje de bienvenida y confirmación de que el negocio está configurado
- **Resultado** el usuario ve la pantalla de "¡Listo!" y puede hacer clic en el botón para ingresar al dashboard por primera vez

**Escenario 2 — Ingreso al dashboard desde el onboarding**
- **Dado que** el usuario hace clic en "Ir al dashboard" en la pantalla de confirmación
- **El sistema** navega a `/dashboard` usando el JWT almacenado en localStorage
- **Resultado** el usuario ve el dashboard con la card de bienvenida mostrando el nombre del negocio configurado

---

## 3. Dashboard

---

### HU-10 — Visualización del resumen operativo

**Como** dueño o recepcionista,  
**quiero** ver un resumen del estado operativo del negocio,  
**para** tener visibilidad inmediata de lo más importante del día.

**Criterios de aceptación:**
- Muestra próxima cita, ingresos del mes, contadores por estado y citas del día.
- Los contadores son clickeables y abren el detalle.

**Prioridad:** Alta | **Módulo:** Dashboard | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Dashboard con citas registradas**
- **Dado que** el usuario autenticado tiene citas registradas para el día y el mes en curso
- **El sistema** carga en paralelo `useAppointments()`, `useAnalytics("this_month")` y los datos del usuario desde `/auth/me`, y calcula la próxima cita filtrando por fecha >= ahora y estado no terminal
- **Resultado** el usuario ve la próxima cita con hora animada, los ingresos del mes, los contadores por estado y la lista de citas de hoy

**Escenario 2 — Dashboard sin citas del día**
- **Dado que** el usuario no tiene citas para el día en curso
- **El sistema** devuelve array vacío en el filtro de citas de hoy
- **Resultado** la sección "Citas de Hoy" muestra el ícono de estado vacío con el mensaje "Sin citas programadas para hoy"

**Escenario 3 — Clic en contador con una sola cita**
- **Dado que** el usuario hace clic en el contador "Confirmadas" que tiene exactamente 1 cita
- **El sistema** filtra las citas por estado CONFIRMED, detecta que hay solo una y navega directamente a `/citas/{id}`
- **Resultado** el usuario llega al detalle de esa cita sin pasar por el drawer intermedio

**Escenario 4 — Clic en contador con múltiples citas**
- **Dado que** el usuario hace clic en el contador "Pendientes" que tiene 3 citas
- **El sistema** abre el drawer lateral derecho mostrando las 3 citas pendientes ordenadas por fecha
- **Resultado** el usuario puede revisar y navegar a cada cita desde el drawer sin cambiar de pantalla

**Escenario 5 — Clic en contador con cero citas**
- **Dado que** el usuario hace clic en un contador cuyo valor es 0
- **El sistema** tiene el botón del contador deshabilitado (`disabled={count === 0}`) y no ejecuta ninguna acción
- **Resultado** no ocurre ninguna navegación ni abre el drawer

---

### HU-11 — Alerta de citas pendientes de confirmar

**Como** dueño o recepcionista,  
**quiero** ver alertas con citas pendientes en las próximas 48 horas,  
**para** confirmarlas oportunamente.

**Criterios de aceptación:**
- Muestra citas PENDING con inicio en próximas 48 horas.
- Botón "Confirmar todas" si hay más de una.

**Prioridad:** Alta | **Módulo:** Dashboard | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Confirmación individual de una cita**
- **Dado que** hay una cita pendiente con inicio en las próximas 48 horas y el usuario hace clic en "Confirmar"
- **El sistema** llama a `PATCH /appointments/{id}/status` con `{ status: "CONFIRMED" }` y actualiza el cache de TanStack Query con `invalidateQueries`
- **Resultado** la alerta desaparece del panel de acción requerida y el contador de "Confirmadas" se incrementa en 1 de forma inmediata

**Escenario 2 — Confirmación masiva de todas las citas pendientes**
- **Dado que** hay 3 citas pendientes en las próximas 48 horas y el usuario hace clic en "Confirmar todas"
- **El sistema** ejecuta en paralelo con `Promise.all` las tres mutaciones de cambio de estado
- **Resultado** las 3 alertas desaparecen simultáneamente y la sección muestra "Todo en orden"

**Escenario 3 — Sin citas pendientes próximas**
- **Dado que** no hay citas con estado PENDING en las próximas 48 horas
- **El sistema** el array `pendingUpcoming` es vacío
- **Resultado** la sección muestra el ícono verde con "Todo en orden · Sin citas pendientes de confirmar"

---

### HU-12 — Card de bienvenida con identidad del negocio

**Como** dueño,  
**quiero** ver el nombre y logo de mi negocio en el dashboard,  
**para** confirmar visualmente que estoy en el panel correcto.

**Criterios de aceptación:**
- Muestra logo (imagen o iniciales), tipo, nombre y saludo con el nombre del usuario.
- Se actualiza automáticamente al cambiar logo en configuración.

**Prioridad:** Media | **Módulo:** Dashboard | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Negocio con logo configurado**
- **Dado que** el dueño subió y guardó un logo en Configuración → Datos del Negocio
- **El sistema** obtiene la URL base64 del logo desde `/auth/me → business.logoUrl` y la renderiza en un contenedor 64×64px con `object-cover`
- **Resultado** la card muestra la imagen del negocio como logo en vez de las iniciales

**Escenario 2 — Negocio sin logo configurado**
- **Dado que** el negocio no tiene logo subido (`logoUrl` es null)
- **El sistema** renderiza un cuadrado con el color primario mostrando las primeras letras de cada palabra del nombre del negocio (máximo 2 iniciales)
- **Resultado** la card muestra las iniciales como avatar (ej. "SE" para "Studio Elegance")

**Escenario 3 — Actualización del logo en tiempo real**
- **Dado que** el usuario sube un nuevo logo en configuración y hace clic en "Guardar"
- **El sistema** invalida los query keys `["settings"]` y `["me"]` simultáneamente
- **Resultado** al navegar al dashboard, la card muestra inmediatamente el nuevo logo sin necesidad de recargar la página

---

## 4. Gestión de Citas

---

### HU-13 — Visualización del calendario de citas

**Como** dueño o recepcionista,  
**quiero** ver todas las citas en un calendario con vistas de Día, Semana y Mes,  
**para** tener una visión clara de la agenda.

**Criterios de aceptación:**
- Tres vistas seleccionables: Día, Semana, Mes.
- Citas con colores diferenciados por estado.

**Prioridad:** Alta | **Módulo:** Citas | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Vista diaria con citas**
- **Dado que** el usuario está en la vista "Día" de la fecha actual y hay citas registradas
- **El sistema** filtra las citas del día mostrando cada una en su franja horaria con nombre del cliente, servicio y colaborador
- **Resultado** el usuario ve un grid horario con las citas posicionadas en sus horas correspondientes

**Escenario 2 — Navegación entre fechas**
- **Dado que** el usuario hace clic en la flecha "siguiente" del calendario
- **El sistema** avanza la fecha activa un día/semana/mes según la vista activa y recarga las citas correspondientes
- **Resultado** el calendario muestra la nueva fecha sin recargar la página completa

**Escenario 3 — Clic en una cita del calendario**
- **Dado que** el usuario hace clic sobre una cita en cualquier vista del calendario
- **El sistema** navega a `/citas/{id}` mostrando el modal de detalle de la cita
- **Resultado** el usuario puede ver el detalle completo y realizar acciones sobre la cita

**Escenario 4 — Día sin citas en vista diaria**
- **Dado que** el usuario navega a un día que no tiene citas registradas
- **El sistema** muestra el grid horario vacío sin tarjetas de citas
- **Resultado** el usuario ve el día vacío y puede crear una nueva cita desde el botón de acción

---

### HU-14 — Creación de nueva cita

**Como** dueño o recepcionista,  
**quiero** crear una cita seleccionando cliente, colaborador, servicio, fecha y hora,  
**para** registrar una reserva en el sistema.

**Criterios de aceptación:**
- Los slots disponibles respetan horario del negocio y del colaborador.
- La cita se crea con estado PENDING.
- Se valida conflicto de horario antes de guardar.

**Prioridad:** Alta | **Módulo:** Citas | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Creación exitosa de cita**
- **Dado que** el recepcionista selecciona cliente "María López", colaborador "Carlos", servicio "Manicura" (45 min), fecha "2026-06-10" y slot "10:00"
- **El sistema** calcula `endTime = 10:45`, verifica que no hay conflicto de horario para Carlos en ese rango, y crea la cita con estado PENDING
- **Resultado** la cita aparece en el calendario en el slot seleccionado y el contador de "Pendientes" del dashboard se incrementa

**Escenario 2 — No hay slots disponibles para la fecha/colaborador seleccionados**
- **Dado que** el usuario selecciona un colaborador que no trabaja el día seleccionado o tiene su agenda completa
- **El sistema** llama a `GET /availability/slots` y recibe un array vacío con la razón correspondiente
- **Resultado** el selector de hora muestra el mensaje "No hay horarios disponibles para esta fecha" y el botón de guardar permanece deshabilitado

**Escenario 3 — Conflicto de horario con otra cita del colaborador**
- **Dado que** el colaborador ya tiene una cita de 10:00 a 11:00 y el usuario intenta crear una cita en el mismo rango
- **El sistema** detecta el conflicto en el backend y retorna error 409 con el detalle de la cita existente
- **Resultado** el usuario ve el mensaje "El colaborador ya tiene una cita de 10:00 a 11:00 con [cliente] ([servicio])" y puede elegir otro slot

**Escenario 4 — Cita fuera del horario de atención del negocio**
- **Dado que** se intenta crear una cita cuya hora de inicio o fin cae fuera del `openTime`–`closeTime` del negocio
- **El sistema** valida en el backend y retorna error 422 con el mensaje "La cita debe estar dentro del horario de atención: HH:MM – HH:MM"
- **Resultado** la cita no se crea y el usuario ve el mensaje de error con el rango horario permitido

**Escenario 5 — Slots filtrados por horario del negocio y colaborador**
- **Dado que** el negocio abre a las 09:00 y cierra a las 18:00, y el colaborador trabaja de 08:00 a 20:00
- **El sistema** en `/availability/slots` calcula la intersección: `max(08:00, 09:00) = 09:00` y `min(20:00, 18:00) = 18:00`
- **Resultado** los slots disponibles solo van de 09:00 a 18:00, respetando el horario real del negocio

---

### HU-15 — Detalle de cita

**Como** dueño o recepcionista,  
**quiero** ver el detalle completo de una cita,  
**para** revisar su información y realizar acciones sobre ella.

**Criterios de aceptación:**
- Modal con datos completos: cliente, colaborador, servicio, fecha, hora, precio, notas y estado.
- Permite cambiar estado, registrar anticipo y cobrar.

**Prioridad:** Alta | **Módulo:** Citas | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Visualización del detalle de cita**
- **Dado que** el usuario hace clic en una cita del calendario o desde el dashboard
- **El sistema** llama a `GET /appointments/{id}` e incluye datos de cliente, colaborador y servicio en la respuesta
- **Resultado** el modal muestra todos los datos de la cita con los botones de acción correspondientes al estado actual

**Escenario 2 — Cita no encontrada**
- **Dado que** el usuario intenta acceder a `/citas/{id}` con un ID que no existe o no pertenece al negocio
- **El sistema** retorna error 404 desde el backend
- **Resultado** el usuario ve la pantalla de error correspondiente con opción de volver al calendario

**Escenario 3 — Acción de cobro desde el detalle**
- **Dado que** la cita está en estado CONFIRMED y el usuario hace clic en "Cobrar"
- **El sistema** navega a `/citas/{id}/cobrar` manteniendo el estado de la cita actualizado
- **Resultado** el usuario llega a la pantalla de cierre con el resumen del servicio y el anticipo descontado si aplica

---

### HU-16 — Cambio de estado de cita

**Como** dueño o recepcionista,  
**quiero** cambiar el estado de una cita,  
**para** mantener el registro actualizado.

**Criterios de aceptación:**
- Estados: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW.
- El cambio se refleja en tiempo real.

**Prioridad:** Alta | **Módulo:** Citas | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Confirmación de cita pendiente**
- **Dado que** una cita está en estado PENDING y el usuario hace clic en "Confirmar"
- **El sistema** envía `PATCH /appointments/{id}/status` con `{ status: "CONFIRMED" }` y el hook `useUpdateAppointmentStatus` invalida el cache de citas
- **Resultado** el badge de estado en el modal cambia a "Confirmada" y el contador del dashboard se actualiza automáticamente

**Escenario 2 — Cancelación de cita**
- **Dado que** el usuario cancela una cita activa
- **El sistema** actualiza el estado a CANCELLED; la cita deja de aparecer en los cálculos de disponibilidad del colaborador
- **Resultado** la cita aparece con estado "Cancelada" en el historial y el slot queda libre para nuevas citas

**Escenario 3 — Marcado de no-show**
- **Dado que** el cliente no se presentó a su cita y el usuario selecciona "No se presentó"
- **El sistema** actualiza el estado a NO_SHOW; la cita se registra en la tasa de no-shows de las analíticas
- **Resultado** el KPI de `noShowRate` del dashboard se actualiza al consultar las analíticas del período

---

### HU-17 — Cierre y cobro de cita

**Como** dueño o recepcionista,  
**quiero** registrar el pago completo de una cita,  
**para** cerrarla y que quede en los ingresos del negocio.

**Criterios de aceptación:**
- Método de pago: Efectivo, Tarjeta, Transferencia o App.
- Anticipo descontado del total.
- Cita cambia a COMPLETED al confirmar.

**Prioridad:** Alta | **Módulo:** Citas | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Cobro completo sin anticipo**
- **Dado que** la cita de "Corte de cabello" con precio S/35 no tiene anticipo registrado y el recepcionista selecciona método "Efectivo" con 0% de propina
- **El sistema** envía `POST /appointments/{id}/payment` con `{ tipPercent: 0, paymentMethod: "cash" }` y actualiza el estado de la cita a COMPLETED
- **Resultado** el total cobrado es S/35, la cita queda COMPLETED y el ingreso se suma a las analíticas del mes

**Escenario 2 — Cobro con anticipo previo registrado**
- **Dado que** la cita tiene un anticipo de S/10 registrado y el precio del servicio es S/50
- **El sistema** muestra el desglose: Precio S/50, Anticipo recibido -S/10, Total a cobrar S/40
- **Resultado** el recepcionista solo cobra S/40 al cliente y el sistema registra el pago completo

**Escenario 3 — Cobro con propina**
- **Dado que** el recepcionista selecciona 10% de propina sobre un servicio de S/100
- **El sistema** calcula `tipAmount = 100 × 0.10 = S/10` y lo suma al total
- **Resultado** el total cobrado es S/110 y el registro queda con `tipPercent: 0.10` en la cita

**Escenario 4 — Método de pago con tarjeta**
- **Dado que** el cliente paga con tarjeta de crédito
- **El sistema** registra `paymentMethod: "card"` en el campo de la cita
- **Resultado** el reporte de pagos puede distinguir entre métodos de cobro

---

### HU-18 — Registro de anticipo parcial

**Como** dueño o recepcionista,  
**quiero** registrar un anticipo que paga el cliente al agendar,  
**para** descontarlo al momento del cobro final.

**Criterios de aceptación:**
- El anticipo queda en `depositAmount` de la cita.
- En el cobro final se muestra descontado.

**Prioridad:** Media | **Módulo:** Citas | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Registro de anticipo exitoso**
- **Dado que** el recepcionista ingresa S/20 como anticipo en el detalle de una cita pendiente
- **El sistema** envía `POST /appointments/{id}/deposit` con `{ depositAmount: 20 }` y actualiza el campo en la base de datos
- **Resultado** el detalle de la cita muestra "Anticipo: S/20" y al ir al cobro final ese monto aparece descontado

**Escenario 2 — Anticipo mayor al precio del servicio**
- **Dado que** el usuario intenta registrar un anticipo mayor al precio total del servicio
- **El sistema** debería validar que `depositAmount <= price` para evitar inconsistencias en el cobro
- **Resultado** el campo muestra un error de validación indicando que el anticipo no puede superar el precio del servicio

---

## 5. Gestión de Clientes

---

### HU-19 — Directorio de clientes

**Como** dueño o recepcionista,  
**quiero** ver la lista de todos los clientes con búsqueda en tiempo real,  
**para** encontrar rápidamente a un cliente.

**Criterios de aceptación:**
- Búsqueda con debounce de 300ms.
- Botón para crear nuevo cliente.

**Prioridad:** Alta | **Módulo:** Clientes | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Búsqueda de cliente por nombre**
- **Dado que** el usuario escribe "Mar" en el campo de búsqueda
- **El sistema** espera 300ms (debounce) y luego llama a `GET /clients?search=Mar`, filtrando por nombre o apellido que contenga "Mar" (case-insensitive)
- **Resultado** la lista se actualiza mostrando solo los clientes que coinciden: "María López", "Marco Ríos", etc.

**Escenario 2 — Búsqueda sin resultados**
- **Dado que** el usuario busca un nombre que no existe en la base de datos
- **El sistema** recibe un array vacío del servidor
- **Resultado** la lista muestra el estado vacío con el mensaje "No se encontraron clientes" y opción de crear uno nuevo

**Escenario 3 — Lista completa sin búsqueda**
- **Dado que** el campo de búsqueda está vacío
- **El sistema** llama a `GET /clients` sin parámetros y retorna todos los clientes del negocio ordenados
- **Resultado** el usuario ve todos los clientes paginados con nombre, teléfono y número de visitas

---

### HU-20 — Registro de nuevo cliente

**Como** dueño o recepcionista,  
**quiero** registrar un nuevo cliente,  
**para** asociarlo a citas y llevar su historial.

**Criterios de aceptación:**
- Campos: Nombre, Apellido, DNI, Teléfono, Email y Notas.

**Prioridad:** Alta | **Módulo:** Clientes | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Registro de cliente exitoso**
- **Dado que** el recepcionista completa el formulario con nombre "Lucía", apellido "Torres", teléfono "987654321" y hace clic en "Guardar"
- **El sistema** envía POST `/clients` con los datos y el `businessId` del negocio autenticado; retorna el cliente creado con `totalVisits: 0` y `totalSpent: 0`
- **Resultado** el nuevo cliente aparece en el directorio y puede ser seleccionado al crear una nueva cita

**Escenario 2 — Registro con campo obligatorio vacío**
- **Dado que** el recepcionista intenta guardar sin ingresar el nombre del cliente
- **El sistema** valida el campo `required` del formulario y bloquea el envío
- **Resultado** el campo nombre muestra el error de validación y no se realiza ninguna petición al servidor

---

### HU-21 — Perfil y edición de cliente

**Como** dueño o recepcionista,  
**quiero** ver el perfil completo de un cliente y poder editar sus datos inline,  
**para** mantener la información actualizada.

**Criterios de aceptación:**
- Muestra datos de contacto, total de visitas, gasto total e historial de citas.
- Edición inline sin cambiar de pantalla.

**Prioridad:** Alta | **Módulo:** Clientes | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Edición inline del teléfono del cliente**
- **Dado que** el usuario modifica el teléfono de "987654321" a "912345678" y hace clic en guardar
- **El sistema** envía `PATCH /clients/{id}` con `{ phone: "912345678" }` e invalida el cache del cliente
- **Resultado** el perfil muestra el nuevo número sin necesidad de recargar la página

**Escenario 2 — Visualización del historial de citas del cliente**
- **Dado que** el cliente tiene 5 citas registradas con el negocio
- **El sistema** carga el historial de citas asociadas al cliente ordenadas por fecha descendente
- **Resultado** el usuario ve las 5 citas con fecha, servicio, colaborador y estado, junto con `totalVisits: 5` y `totalSpent` calculado

**Escenario 3 — Eliminación de cliente**
- **Dado que** el usuario hace clic en "Eliminar cliente" y confirma la acción en el diálogo de confirmación
- **El sistema** envía `DELETE /clients/{id}` y elimina el registro de la base de datos
- **Resultado** el usuario es redirigido al directorio de clientes y el cliente eliminado ya no aparece en la lista

---

## 6. Gestión de Colaboradores

---

### HU-22 — Lista de colaboradores

**Como** dueño,  
**quiero** ver la lista de todos los colaboradores del negocio,  
**para** tener visión general del equipo.

**Criterios de aceptación:**
- Lista con nombre, rol, especialidades y estado.

**Prioridad:** Alta | **Módulo:** Colaboradores | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Lista con colaboradores activos e inactivos**
- **Dado que** el negocio tiene 3 colaboradores activos y 1 inactivo
- **El sistema** llama a `GET /collaborators` y retorna todos los colaboradores del negocio
- **Resultado** los 4 colaboradores aparecen en la lista; los inactivos se muestran visualmente diferenciados (opacidad reducida o badge "Inactivo")

**Escenario 2 — Lista vacía sin colaboradores**
- **Dado que** el negocio no ha registrado ningún colaborador
- **El sistema** retorna un array vacío
- **Resultado** la lista muestra el estado vacío con botón prominente para crear el primer colaborador

---

### HU-23 — Registro de nuevo colaborador

**Como** dueño,  
**quiero** registrar un nuevo miembro del equipo,  
**para** asignarle citas y configurar su horario.

**Criterios de aceptación:**
- Campos: Nombre, Apellido, Rol, Especialidades, Teléfono, Tipo y número de documento.

**Prioridad:** Alta | **Módulo:** Colaboradores | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Registro exitoso de colaborador**
- **Dado que** el dueño ingresa todos los datos del nuevo colaborador "Carlos Ramírez", rol "Estilista", especialidades ["Corte", "Coloración"]
- **El sistema** envía POST `/collaborators` con los datos y el `businessId`, crea el colaborador con `isActive: true` por defecto
- **Resultado** el colaborador aparece en la lista y está disponible para ser asignado a citas

**Escenario 2 — Colaborador sin especialidades**
- **Dado que** el dueño registra un colaborador sin ingresar especialidades
- **El sistema** acepta `specialties: []` como valor válido
- **Resultado** el colaborador se crea sin especialidades y pueden añadirse desde su perfil posteriormente

---

### HU-24 — Perfil del colaborador

**Como** dueño,  
**quiero** ver y editar el perfil completo de un colaborador,  
**para** mantener el directorio del equipo actualizado.

**Criterios de aceptación:**
- Edición de todos los campos del perfil.
- Cambio de foto de perfil.
- Eliminación con confirmación.

**Prioridad:** Alta | **Módulo:** Colaboradores | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Actualización de foto de perfil**
- **Dado que** el dueño sube una imagen JPG del colaborador desde el botón de cámara
- **El sistema** convierte la imagen a base64, muestra el preview inmediatamente y la incluye en el PATCH `/collaborators/{id}` al guardar
- **Resultado** la foto del colaborador se actualiza en su perfil y aparece en la asignación de citas

**Escenario 2 — Cambio de estado activo/inactivo**
- **Dado que** el dueño desactiva un colaborador usando el toggle de estado
- **El sistema** guarda `isActive: false` en la base de datos
- **Resultado** el colaborador no aparece como opción disponible al crear nuevas citas, pero su historial de citas pasadas se mantiene

**Escenario 3 — Eliminación de colaborador**
- **Dado que** el dueño hace clic en "Eliminar" y confirma la acción
- **El sistema** envía DELETE `/collaborators/{id}` y el colaborador es eliminado
- **Resultado** el colaborador desaparece de la lista y no puede ser asignado a nuevas citas

---

### HU-25 — Configuración del horario laboral del colaborador

**Como** dueño,  
**quiero** definir los días y horas en que trabaja cada colaborador,  
**para** que el sistema solo ofrezca citas cuando esté disponible.

**Criterios de aceptación:**
- Horario del colaborador debe estar dentro del horario del negocio.
- Al activar un día fuera del rango, se auto-corrige.
- Los inputs muestran el rango del local como referencia.

**Prioridad:** Alta | **Módulo:** Colaboradores | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Configuración de horario válido dentro del rango del negocio**
- **Dado que** el negocio atiende de 09:00 a 18:00 y el dueño configura al colaborador de 10:00 a 16:00 el lunes
- **El sistema** acepta el horario porque `10:00 >= 09:00` y `16:00 <= 18:00`
- **Resultado** el colaborador aparece disponible de 10:00 a 16:00 los lunes al calcular slots de citas

**Escenario 2 — Auto-corrección al activar un día con horario fuera del rango**
- **Dado que** el colaborador tenía guardado un horario de 07:00 a 22:00 (antes de configurar el horario del negocio) y el dueño activa ese día
- **El sistema** detecta que `07:00 < bizOpen (09:00)` y `22:00 > bizClose (18:00)`, y auto-corrige a `start: 09:00, end: 18:00`
- **Resultado** el horario del día activado se ajusta automáticamente al rango del negocio sin que el usuario tenga que corregirlo manualmente

**Escenario 3 — Intento de ingresar hora de inicio fuera del rango**
- **Dado que** el dueño escribe "07:00" en el input de hora de inicio para un día habilitado
- **El sistema** en la función `updateDay` detecta que `"07:00" < bizOpen` y reemplaza el valor con `bizOpen`
- **Resultado** el campo muestra automáticamente "09:00" (la hora de apertura del negocio) en lugar de "07:00"

**Escenario 4 — Badge de referencia del horario del negocio**
- **Dado que** el dueño abre el perfil de un colaborador para configurar su horario
- **El sistema** obtiene `openTime` y `closeTime` de `useSettings()` y los muestra como badge junto al título "Horario Laboral Regular"
- **Resultado** el dueño ve "Rango del local: 09:00 – 18:00" como referencia al configurar el horario de cada día

**Escenario 5 — Colaborador desactivado en día de descanso**
- **Dado que** el colaborador tiene el domingo desactivado (toggle en "Descanso")
- **El sistema** no incluye el domingo en la consulta de disponibilidad
- **Resultado** al crear una cita seleccionando ese colaborador en domingo, no aparecen slots disponibles

---

### HU-26 — Gestión de ausencias y bloqueos del colaborador

**Como** dueño,  
**quiero** registrar ausencias o bloqueos para un colaborador,  
**para** que el sistema no ofrezca citas en esas fechas.

**Criterios de aceptación:**
- Ausencia con motivo, fecha inicio y fin opcionales.
- Las ausencias se consideran en la disponibilidad.

**Prioridad:** Media | **Módulo:** Colaboradores | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Registro de ausencia de un día**
- **Dado que** el dueño registra una ausencia de un solo día con motivo "Capacitación" el 15/06/2026
- **El sistema** envía POST `/collaborators/{id}/absences` con `{ startDate: "2026-06-15", reason: "Capacitación" }` y guarda la ausencia
- **Resultado** el 15 de junio el colaborador no aparece disponible al buscar slots para nuevas citas

**Escenario 2 — Registro de ausencia por rango de fechas**
- **Dado que** el dueño registra una ausencia de vacaciones del 01/07 al 15/07/2026
- **El sistema** guarda `startDate: "2026-07-01"` y `endDate: "2026-07-15"` en la ausencia
- **Resultado** durante ese rango completo el colaborador no tiene disponibilidad en el sistema

**Escenario 3 — Eliminación de ausencia**
- **Dado que** el dueño elimina una ausencia registrada haciendo clic en el ícono de eliminar
- **El sistema** envía DELETE `/collaborators/{id}/absences/{absenceId}` y actualiza el cache
- **Resultado** el colaborador recupera su disponibilidad en las fechas de la ausencia eliminada

---

## 7. Gestión de Servicios

---

### HU-27 — Catálogo de servicios

**Como** dueño o recepcionista,  
**quiero** ver el catálogo completo de servicios con búsqueda,  
**para** conocer los servicios disponibles.

**Criterios de aceptación:**
- Muestra nombre, categoría, duración, precio y estado.
- Servicios inactivos diferenciados visualmente.

**Prioridad:** Alta | **Módulo:** Servicios | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Visualización del catálogo con servicios activos e inactivos**
- **Dado que** el negocio tiene 5 servicios activos y 2 inactivos
- **El sistema** llama a `GET /services` y retorna todos los servicios del negocio sin filtrar por estado
- **Resultado** los 7 servicios se muestran en la lista; los inactivos aparecen con badge "Inactivo" y opacidad diferenciada

**Escenario 2 — Búsqueda de servicio**
- **Dado que** el usuario escribe "manic" en el buscador
- **El sistema** filtra con debounce de 300ms y llama a `GET /services?search=manic`
- **Resultado** solo aparecen los servicios cuyo nombre contiene "manic" (ej. "Manicura", "Manicura spa")

---

### HU-28 — Registro de nuevo servicio

**Como** dueño,  
**quiero** registrar un nuevo servicio en el catálogo,  
**para** que esté disponible al agendar citas.

**Criterios de aceptación:**
- Campos: Nombre, Descripción, Categoría, Duración, Buffer, Precio, Color e IsActive.

**Prioridad:** Alta | **Módulo:** Servicios | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Registro exitoso de servicio**
- **Dado que** el dueño ingresa "Tinte de cabello", categoría "Coloración", duración 90 min, buffer 15 min, precio S/120, color azul y lo marca como activo
- **El sistema** envía POST `/services` con todos los campos validados, crea el servicio en la base de datos e invalida el cache de servicios
- **Resultado** el servicio aparece en el catálogo y puede seleccionarse al crear nuevas citas

**Escenario 2 — Servicio con buffer de tiempo**
- **Dado que** el servicio "Keratina" tiene duración 120 min y buffer 30 min
- **El sistema** al calcular slots usa `totalMinutes = 120 + 30 = 150 min` para determinar la disponibilidad del colaborador
- **Resultado** el colaborador queda bloqueado 2h30min por cita de Keratina, evitando solapamientos durante la recuperación del servicio

---

### HU-29 — Edición y desactivación de servicio

**Como** dueño,  
**quiero** editar o desactivar un servicio existente,  
**para** mantener el catálogo actualizado sin perder historial.

**Criterios de aceptación:**
- Al desactivar, no aparece en el selector de nueva cita.
- El historial de citas pasadas no se ve afectado.

**Prioridad:** Alta | **Módulo:** Servicios | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Edición del precio de un servicio**
- **Dado que** el dueño actualiza el precio de "Corte de cabello" de S/30 a S/35
- **El sistema** envía `PATCH /services/{id}` con `{ price: 35 }` e invalida el cache
- **Resultado** las nuevas citas de ese servicio se crean con precio S/35; las citas pasadas mantienen el precio que tenían al momento de su creación

**Escenario 2 — Desactivación de un servicio**
- **Dado que** el dueño desactiva el servicio "Extensiones" cambiando `isActive: false`
- **El sistema** guarda el cambio y el servicio ya no aparece en los selectores de nueva cita
- **Resultado** el catálogo muestra el servicio como "Inactivo" y no puede ser asignado a nuevas citas, aunque las citas existentes con ese servicio permanecen

**Escenario 3 — Eliminación de servicio**
- **Dado que** el dueño confirma la eliminación de un servicio sin citas asociadas
- **El sistema** envía DELETE `/services/{id}` y elimina el registro
- **Resultado** el servicio desaparece del catálogo permanentemente

---

## 8. Reportes y Analíticas

---

### HU-30 — Visualización de KPIs del negocio

**Como** dueño,  
**quiero** ver los indicadores clave de rendimiento filtrados por período,  
**para** tomar decisiones basadas en datos reales.

**Criterios de aceptación:**
- KPIs: Ingresos totales, Total citas, Citas completadas, Tasa de no-shows.
- Filtros: Hoy, Esta semana, Este mes, Este año.

**Prioridad:** Alta | **Módulo:** Reportes | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Carga de KPIs del mes actual**
- **Dado que** el usuario está en la página de Reportes con el filtro "Este mes" activo
- **El sistema** llama a `GET /analytics?period=this_month` y agrega las citas completadas, calcula ingresos sumando `price + tipAmount` de citas COMPLETED, y calcula `noShowRate = noShows / totalCitas`
- **Resultado** el usuario ve los KPIs actualizados del mes en curso con los valores reales de la base de datos

**Escenario 2 — Cambio de período a "Hoy"**
- **Dado que** el usuario selecciona el filtro "Hoy"
- **El sistema** invalida el query anterior y llama a `GET /analytics?period=today` filtrando solo las citas del día
- **Resultado** los KPIs se actualizan inmediatamente mostrando los números del día en curso

**Escenario 3 — Período sin citas**
- **Dado que** el usuario selecciona "Esta semana" y no hay citas en ese rango
- **El sistema** retorna KPIs en cero: `{ totalRevenue: 0, totalAppointments: 0, completedAppointments: 0, noShowRate: 0 }`
- **Resultado** todos los indicadores muestran "0" o "0%" sin errores en la interfaz

---

### HU-31 — Reporte de ingresos por período

**Como** dueño,  
**quiero** ver el desglose de ingresos del período seleccionado,  
**para** evaluar la rentabilidad del negocio.

**Criterios de aceptación:**
- Ingresos de citas COMPLETED con pago registrado.
- Conteo de citas cobradas incluido.

**Prioridad:** Alta | **Módulo:** Reportes | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Cálculo de ingresos del mes**
- **Dado que** en el mes hay 10 citas COMPLETED con precios entre S/30 y S/150 más propinas
- **El sistema** suma todos los `price` y `tipAmount` de las citas COMPLETED del período
- **Resultado** el usuario ve el ingreso total exacto del mes con el conteo de citas cobradas

**Escenario 2 — Ingresos del día con cobros mixtos**
- **Dado que** el día tiene 3 citas: una cobrada en efectivo, una en tarjeta y una en transferencia
- **El sistema** suma los ingresos de las 3 citas sin distinción de método de pago para el total del día
- **Resultado** el KPI de ingresos muestra la suma total del día

---

## 9. Configuración del Negocio

---

### HU-32 — Edición de datos del negocio

**Como** dueño,  
**quiero** editar los datos principales de mi negocio y subir un logo,  
**para** mantener la información actualizada.

**Criterios de aceptación:**
- Campos: Nombre, Categoría, RUC, Teléfono, Dirección, Localización y Logo.
- RUC y teléfono se precargan desde el registro.
- El dashboard se actualiza automáticamente al guardar.

**Prioridad:** Alta | **Módulo:** Configuración | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Precarga de datos desde el registro**
- **Dado que** el dueño accede a Configuración → Datos del Negocio por primera vez
- **El sistema** llama a `GET /settings` y carga los datos del negocio incluyendo `ruc` y `phone` que fueron guardados durante el registro
- **Resultado** los campos RUC y Teléfono aparecen precargados con los valores del registro sin que el dueño tenga que ingresarlos de nuevo

**Escenario 2 — Actualización del logo del negocio**
- **Dado que** el dueño sube una imagen PNG de 200×200px y hace clic en "Guardar"
- **El sistema** convierte la imagen a base64, la incluye como `logoUrl` en el PATCH `/settings/business`, e invalida los queries `["settings"]` y `["me"]`
- **Resultado** el logo aparece inmediatamente en el dashboard sin necesidad de recargar la página

**Escenario 3 — Actualización de localización**
- **Dado que** el dueño cambia el Departamento de "Lima" a "Arequipa", lo que actualiza automáticamente las opciones de Provincia y Distrito
- **El sistema** actualiza los selectores en cascada: al cambiar departamento, se selecciona automáticamente la primera provincia y el primer distrito disponibles
- **Resultado** la localización se guarda correctamente como `"Arequipa|Arequipa|Arequipa"` en el campo timezone

**Escenario 4 — Guardado exitoso con feedback visual**
- **Dado que** el dueño hace clic en "Guardar" con datos válidos
- **El sistema** completa el PATCH y muestra el banner "Cambios guardados correctamente" en verde
- **Resultado** el mensaje desaparece automáticamente después de 3 segundos

---

### HU-33 — Configuración de días de operación

**Como** dueño,  
**quiero** configurar los días en que mi negocio atiende,  
**para** que el calendario respete esos días.

**Criterios de aceptación:**
- 7 días seleccionables.
- Afecta la disponibilidad de slots.

**Prioridad:** Alta | **Módulo:** Configuración | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Agregar el sábado como día operativo**
- **Dado que** el negocio solo operaba Lun–Vie y el dueño activa el Sábado
- **El sistema** guarda `operatingDays: ["Mon","Tue","Wed","Thu","Fri","Sat"]` en la base de datos
- **Resultado** el sábado aparece como día disponible en el calendario y se pueden crear citas para ese día

**Escenario 2 — Eliminación de un día operativo**
- **Dado que** el dueño desactiva el lunes de los días operativos
- **El sistema** guarda `operatingDays` sin "Mon"
- **Resultado** el calendario marca el lunes como no disponible y los slots de ese día aparecen vacíos

---

### HU-34 — Configuración del horario de atención del negocio

**Como** dueño,  
**quiero** definir la hora de apertura y cierre de mi negocio,  
**para** que las citas solo se agenden dentro de ese rango.

**Criterios de aceptación:**
- Selectores en intervalos de 30 min en formato 12h.
- Resumen visual del rango y duración total.
- La hora de cierre solo muestra opciones posteriores a la apertura.
- Citas validadas contra este rango en el backend.

**Prioridad:** Alta | **Módulo:** Configuración | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Configuración del horario de 9am a 6pm**
- **Dado que** el dueño selecciona apertura "9:00 AM" y cierre "6:00 PM"
- **El sistema** guarda `openTime: "09:00"` y `closeTime: "18:00"` en la base de datos via PATCH `/settings/agenda`
- **Resultado** el resumen visual muestra "Tu negocio atiende de 9:00 AM a 6:00 PM · 9h" y todos los slots de citas se calculan dentro de ese rango

**Escenario 2 — Selector de cierre filtra opciones inválidas**
- **Dado que** el dueño selecciona apertura "2:00 PM"
- **El sistema** filtra el selector de cierre para mostrar solo opciones `> "14:00"`: 2:30 PM, 3:00 PM, etc.
- **Resultado** el dueño no puede seleccionar una hora de cierre igual o anterior a la apertura

**Escenario 3 — Intento de crear cita fuera del horario via API**
- **Dado que** alguien intenta crear una cita a las 7:00 PM cuando el negocio cierra a las 6:00 PM via POST `/appointments`
- **El sistema** valida que `endMins (19:00 = 1140) > closeMins (18:00 = 1080)` y retorna error 422
- **Resultado** la cita no se crea y el cliente recibe el mensaje "La cita debe estar dentro del horario de atención: 09:00 – 18:00"

**Escenario 4 — Actualización del horario afecta slots disponibles**
- **Dado que** el dueño cambia el horario de cierre de 18:00 a 20:00 y guarda
- **El sistema** invalida el cache de settings y al consultar disponibilidad usa el nuevo `closeTime: "20:00"`
- **Resultado** aparecen nuevos slots disponibles entre 18:00 y 20:00 para los colaboradores cuyo horario cubre ese rango

---

### HU-35 — Configuración de política de cancelación

**Como** dueño,  
**quiero** definir las horas mínimas de anticipación para cancelar,  
**para** proteger el negocio de cancelaciones de último minuto.

**Criterios de aceptación:**
- Campo numérico de 0 a 168 horas.

**Prioridad:** Media | **Módulo:** Configuración | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Configuración de 24 horas de anticipación**
- **Dado que** el dueño ingresa "24" en el campo de horas de anticipación y guarda
- **El sistema** envía PATCH `/settings/agenda` con `{ cancellationHours: 24 }` y actualiza la configuración del negocio
- **Resultado** la política queda guardada como referencia para la gestión de cancelaciones del negocio

**Escenario 2 — Política sin restricción (0 horas)**
- **Dado que** el dueño ingresa "0" en el campo
- **El sistema** acepta el valor `0` como válido (cancelación permitida hasta el último momento)
- **Resultado** el negocio permite cancelaciones sin anticipación mínima requerida

---

### HU-36 — Configuración de usuarios del sistema

**Como** dueño,  
**quiero** gestionar los usuarios con acceso al panel,  
**para** controlar quién opera el sistema.

**Criterios de aceptación:**
- Lista de usuarios con rol.
- El dueño puede agregar o eliminar usuarios.

**Prioridad:** Media | **Módulo:** Configuración | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Visualización de usuarios del negocio**
- **Dado que** el dueño accede a Configuración → Usuarios
- **El sistema** carga todos los usuarios asociados al `businessId` del negocio autenticado con sus roles
- **Resultado** el dueño ve la lista con su propio usuario (OWNER) y los demás usuarios (COLLABORATOR/ADMIN)

**Escenario 2 — Eliminación de un usuario del sistema**
- **Dado que** el dueño elimina a un usuario con rol COLLABORATOR
- **El sistema** elimina el registro de usuario de la base de datos
- **Resultado** ese usuario pierde acceso al panel inmediatamente; su JWT actual retornará 401 en el próximo request

---

### HU-37 — Configuración de notificaciones WhatsApp

**Como** dueño,  
**quiero** configurar el envío de recordatorios automáticos por WhatsApp,  
**para** reducir ausencias y mejorar la experiencia del cliente.

**Criterios de aceptación:**
- UI de configuración implementada.
- Integración real con Twilio/Meta pendiente.

**Prioridad:** Baja | **Módulo:** Configuración | **Estado:** 🔄 UI implementada, integración pendiente

#### Escenarios de comportamiento

**Escenario 1 — Acceso a la pantalla de configuración WhatsApp**
- **Dado que** el dueño accede a Configuración → WhatsApp
- **El sistema** muestra la interfaz de configuración con campos para número de remitente y plantillas de mensaje
- **Resultado** el dueño puede visualizar las opciones disponibles aunque el envío real aún no esté activo

**Escenario 2 — Envío automático de recordatorio (funcionalidad futura)**
- **Dado que** una cita está programada para el día siguiente y el cron job de recordatorios está activo
- **El sistema** enviará un mensaje WhatsApp al número del cliente con el detalle de la cita (servicio, colaborador, hora)
- **Resultado** el cliente recibe el recordatorio en su WhatsApp y puede confirmar o solicitar cambios *(pendiente de integración)*

---

## 10. Notificaciones

---

### HU-38 — Notificaciones in-app

**Como** dueño o recepcionista,  
**quiero** recibir notificaciones dentro del sistema sobre eventos importantes,  
**para** estar al tanto sin revisar manualmente cada sección.

**Criterios de aceptación:**
- Campana con contador de no leídas.
- Polling automático cada 60 segundos.
- Al marcar como leídas, el contador se actualiza.

**Prioridad:** Media | **Módulo:** Notificaciones | **Estado:** ✅ Implementado

#### Escenarios de comportamiento

**Escenario 1 — Aparición de notificaciones no leídas**
- **Dado que** se crea una nueva cita o se registra un evento relevante en el negocio
- **El sistema** genera la notificación derivada del evento y la almacena; el hook `useNotifications()` realiza polling cada 60 segundos y detecta la nueva notificación
- **Resultado** el ícono de campana en la TopBar muestra un badge rojo con el número de notificaciones no leídas

**Escenario 2 — Lectura de notificaciones**
- **Dado que** el usuario hace clic en la campana y ve la lista de notificaciones
- **El sistema** marca las notificaciones como leídas y actualiza el estado en la base de datos
- **Resultado** el badge del contador desaparece o se reduce según las notificaciones que quedaron sin leer

**Escenario 3 — Polling automático sin notificaciones nuevas**
- **Dado que** no hay eventos nuevos en el negocio durante los últimos 60 segundos
- **El sistema** el polling de `useNotifications()` retorna el mismo conjunto de notificaciones sin cambios
- **Resultado** el badge permanece igual y no se genera ninguna re-renderización visible para el usuario

**Escenario 4 — Sesión expirada durante el polling**
- **Dado que** el JWT del usuario expira mientras el sistema está realizando polling de notificaciones
- **El sistema** detecta el error 401 en `apiFetch` y ejecuta la redirección automática a `/login`
- **Resultado** el usuario es redirigido al login sin ver errores en pantalla

---

## Resumen de Estado

| Estado | Cantidad |
|---|---|
| ✅ Implementado | 35 |
| 🔄 Parcialmente implementado | 1 |
| ⏳ Pendiente | 2 |
| **Total HU** | **38** |

---

## Deuda Técnica Relacionada

| HU afectada | Deuda | Prioridad |
|---|---|---|
| HU-37 | Integración real WhatsApp (Twilio/Meta Cloud API + BullMQ + Redis) | Baja |
| HU-31 | Comparativos reales en KPIs (delta vs. período anterior) | Media |
| HU-03 | Migrar JWT de localStorage a httpOnly cookie | Media |
| HU-14 | Protección de rutas server-side + validación de rol en endpoints | Media |
| HU-13 | Drag & drop en calendario (evaluar FullCalendar) | Baja |
| HU-18 | Validación anticipo no puede superar precio del servicio | Media |
| HU-29 | Tabla separada de pagos (actualmente inline en Appointment) | Baja |
| HU-23 | Tabla N:M `staff_services` con precio/duración personalizada por colaborador | Baja |
