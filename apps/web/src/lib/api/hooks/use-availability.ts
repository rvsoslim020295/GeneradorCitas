import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type SlotsResponse = {
  slots: string[];
  slotCollaboratorMap: Record<string, string>;
  slotDuration: number;
  totalDuration?: number;
  reason?: string;
};

export type CheckResponse = {
  available: boolean;
  collaboratorId: string | null;
  reason?: string;
};

export const availabilityKeys = {
  slots: (collaboratorId: string, serviceId: string, date: string) =>
    ["availability", "slots", collaboratorId, serviceId, date] as const,
  check: (collaboratorId: string, serviceId: string, date: string, time: string) =>
    ["availability", "check", collaboratorId, serviceId, date, time] as const,
};

export function useAvailabilityCheck(
  collaboratorId: string,
  serviceId: string,
  date: string,
  time: string, // HH:MM — debounced desde el componente
) {
  const params = new URLSearchParams({ serviceId, date, time });
  if (collaboratorId) params.set("collaboratorId", collaboratorId);

  return useQuery({
    queryKey: availabilityKeys.check(collaboratorId, serviceId, date, time),
    queryFn: () => apiFetch<CheckResponse>(`/availability/check?${params.toString()}`),
    enabled: !!serviceId && !!date && /^\d{2}:\d{2}$/.test(time),
    staleTime: 1000 * 20,
  });
}

export function useAvailabilitySlots(
  collaboratorId: string, // puede ser "" para "cualquiera"
  serviceId: string,
  date: string
) {
  const params = new URLSearchParams({ serviceId, date });
  if (collaboratorId) params.set("collaboratorId", collaboratorId);

  return useQuery({
    queryKey: availabilityKeys.slots(collaboratorId, serviceId, date),
    queryFn: () => apiFetch<SlotsResponse>(`/availability/slots?${params.toString()}`),
    enabled: !!serviceId && !!date, // collaboratorId ya no es requerido
    staleTime: 1000 * 30,
  });
}
