import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type SlotsResponse = {
  slots: string[];
  slotCollaboratorMap: Record<string, string>; // slot → collaboratorId
  slotDuration: number;
  totalDuration?: number;
};

export const availabilityKeys = {
  slots: (collaboratorId: string, serviceId: string, date: string) =>
    ["availability", "slots", collaboratorId, serviceId, date] as const,
};

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
