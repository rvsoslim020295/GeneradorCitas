# GlowManager — Frontend (apps/web)

## Stack
Next.js 15 App Router · TypeScript · Tailwind CSS 4 · Material Design 3 tokens · Lucide React · TanStack Query v5

## Convenciones de datos — OBLIGATORIO

### Nunca uses fetch directo en páginas

Toda comunicación con el API debe pasar por los hooks de `src/lib/api/hooks/`:

```ts
// ✅ Correcto
import { useClients, useCreateClient } from "@/lib/api/hooks";
const { data: clients, isLoading } = useClients(search);
const createClient = useCreateClient();

// ❌ Incorrecto — nunca hacer esto en páginas nuevas
const token = localStorage.getItem("gm_token");
const res = await fetch(`http://localhost:3001/clients`, { headers: { Authorization: `Bearer ${token}` } });
```

### Hooks disponibles por dominio

| Dominio | Hooks |
|---|---|
| Clientes | `useClients(search?)`, `useClient(id)`, `useCreateClient`, `useUpdateClient(id)`, `useDeleteClient` |
| Colaboradores | `useCollaborators(search?)`, `useCollaborator(id)`, `useCollaboratorAbsences(id)`, `useCreateCollaborator`, `useUpdateCollaborator(id)`, `useDeleteCollaborator`, `useAddAbsence(id)`, `useDeleteAbsence(id)` |
| Servicios | `useServices(search?)`, `useService(id)`, `useCreateService`, `useUpdateService(id)`, `useDeleteService` |
| Citas | `useAppointments(params?)`, `useAppointment(id)`, `useCreateAppointment`, `useUpdateAppointmentStatus`, `useRegisterPayment`, `useRegisterDeposit` |
| Analíticas | `useAnalytics(period)` |
| Notificaciones | `useNotifications()` |
| Configuración | `useSettings()`, `useUpdateSettings()` |
| Disponibilidad | `useAvailabilitySlots(collaboratorId, serviceId, date)` |

### Para datos no cubiertos por un hook existente

Usa `apiFetch` + `useQuery`/`useMutation` directamente:

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

// Query
const { data } = useQuery({
  queryKey: ["mi-recurso", id],
  queryFn: () => apiFetch<MiTipo>(`/mi-endpoint/${id}`),
});

// Mutación
const qc = useQueryClient();
const mutation = useMutation({
  mutationFn: (body: Partial<MiTipo>) =>
    apiFetch(`/mi-endpoint`, { method: "POST", body: JSON.stringify(body) }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["mi-recurso"] }),
});
```

### Debounce en búsquedas

```ts
import { useDebounce } from "@/lib/hooks/use-debounce";
const debouncedSearch = useDebounce(search, 300);
const { data } = useClients(debouncedSearch || undefined);
```

### Estados de carga y error

```tsx
const { data = [], isLoading, error } = useClients();

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage />;
```

## Estructura de archivos

```
src/lib/api/
  client.ts           apiFetch — cliente fetch centralizado con auth
  hooks/
    index.ts          barrel de exports
    use-clients.ts
    use-collaborators.ts
    use-services.ts
    use-appointments.ts
    use-analytics.ts
    use-notifications.ts
    use-settings.ts
    use-availability.ts
src/lib/hooks/
  use-debounce.ts
src/components/
  query-provider.tsx  QueryClientProvider + DevTools
```

## API base

`NEXT_PUBLIC_API_URL` (default: `http://localhost:3001`). El `apiFetch` lo maneja automáticamente — no hardcodear la URL en páginas.

## Invalidación de caché

Después de una mutación, invalida los query keys relevantes con `qc.invalidateQueries()`. Todos los hooks de mutación ya lo hacen internamente. Si creas una mutación ad-hoc con `useMutation`, recuerda invalidar manualmente.
