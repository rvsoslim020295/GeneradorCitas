import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type Client = {
  id: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  dni: string | null;
  notes: string | null;
  totalVisits: number;
  totalSpent: number;
};

export const clientKeys = {
  all: ["clients"] as const,
  list: (search?: string) => ["clients", "list", search ?? ""] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
};

export function useClients(search?: string) {
  return useQuery({
    queryKey: clientKeys.list(search),
    queryFn: () => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : "";
      return apiFetch<Client[]>(`/clients${qs}`);
    },
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => apiFetch<Client>(`/clients/${id}`),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Client>) =>
      apiFetch<Client>("/clients", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }),
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Client>) =>
      apiFetch<Client>(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.detail(id) });
      qc.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }),
  });
}
