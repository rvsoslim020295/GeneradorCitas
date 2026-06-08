import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type PackageService = {
  id: string;
  serviceId: string;
  service: { id: string; name: string; durationMin: number; price: number; color: string; category: string };
};

export type Package = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  isActive: boolean;
  services: PackageService[];
  createdAt: string;
};

export function usePackages() {
  return useQuery<Package[]>({
    queryKey: ["packages"],
    queryFn: () => apiFetch<Package[]>("/packages"),
  });
}

export function usePackage(id: string) {
  return useQuery<Package>({
    queryKey: ["packages", id],
    queryFn: () => apiFetch<Package>(`/packages/${id}`),
    enabled: !!id,
  });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; price: number; serviceIds: string[] }) =>
      apiFetch<Package>("/packages", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packages"] }),
  });
}

export function useUpdatePackage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<{ name: string; description: string; price: number; isActive: boolean; serviceIds: string[] }>) =>
      apiFetch<Package>(`/packages/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] });
      qc.invalidateQueries({ queryKey: ["packages", id] });
    },
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/packages/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packages"] }),
  });
}
