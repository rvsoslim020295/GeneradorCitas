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
};

export const settingsKeys = {
  all: ["settings"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => apiFetch<Settings>("/settings"),
    staleTime: 1000 * 60 * 5, // 5 minutos — la config cambia poco
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
