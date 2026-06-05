import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  durationMin: number;
  bufferMinutes: number;
  price: number;
  color: string;
  isActive: boolean;
};

export const serviceKeys = {
  all: ["services"] as const,
  list: (search?: string) => ["services", "list", search ?? ""] as const,
  detail: (id: string) => ["services", "detail", id] as const,
};

type ServicesResponse = {
  services: Service[];
  grouped: Record<string, Service[]>;
};

export function useServices(search?: string) {
  return useQuery({
    queryKey: serviceKeys.list(search),
    queryFn: () => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : "";
      return apiFetch<ServicesResponse>(`/services${qs}`);
    },
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => apiFetch<Service>(`/services/${id}`),
    enabled: !!id,
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/services/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}
