import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type Slot = { time: string; available: boolean };

export const availabilityKeys = {
  slots: (collaboratorId: string, serviceId: string, date: string) =>
    ["availability", "slots", collaboratorId, serviceId, date] as const,
};

export function useAvailabilitySlots(
  collaboratorId: string,
  serviceId: string,
  date: string
) {
  return useQuery({
    queryKey: availabilityKeys.slots(collaboratorId, serviceId, date),
    queryFn: () =>
      apiFetch<Slot[]>(
        `/availability/slots?collaboratorId=${collaboratorId}&serviceId=${serviceId}&date=${date}`
      ),
    enabled: !!collaboratorId && !!serviceId && !!date,
    staleTime: 1000 * 30,
  });
}
