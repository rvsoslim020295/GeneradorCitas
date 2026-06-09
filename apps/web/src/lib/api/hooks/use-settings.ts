import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type Settings = {
  name: string;
  type: string;
  phone: string | null;
  address: string | null;
  timezone: string;
  slotMinutes: number;
  cancellationHours: number;
  operatingDays: string[];
  openTime: string;
  closeTime: string;
  waTplConfirmation: string | null;
  waTplReminder: string | null;
  waTplPayment: string | null;
};

export const settingsKeys = {
  all: ["settings"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => apiFetch<{ business: Settings }>("/settings").then((r) => r.business),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Settings>) =>
      apiFetch("/settings", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}
