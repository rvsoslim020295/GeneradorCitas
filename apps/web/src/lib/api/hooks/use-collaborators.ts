import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type Collaborator = {
  id: string;
  name: string;
  lastName: string | null;
  role: string;
  specialties: string[];
  isActive: boolean;
  performsServices: boolean;
  avatarUrl: string | null;
  schedule: Record<string, { active: boolean; start: string; end: string }> | null;
  documentType: string | null;
  documentNumber: string | null;
  phone: string | null;
};

export type Absence = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
};

export const collaboratorKeys = {
  all: ["collaborators"] as const,
  list: (search?: string) => ["collaborators", "list", search ?? ""] as const,
  detail: (id: string) => ["collaborators", "detail", id] as const,
  absences: (id: string) => ["collaborators", id, "absences"] as const,
};

export function useCollaborators(search?: string) {
  return useQuery({
    queryKey: collaboratorKeys.list(search),
    queryFn: () => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : "";
      return apiFetch<Collaborator[]>(`/collaborators${qs}`);
    },
  });
}

export function useCollaborator(id: string) {
  return useQuery({
    queryKey: collaboratorKeys.detail(id),
    queryFn: () => apiFetch<Collaborator>(`/collaborators/${id}`),
    enabled: !!id,
  });
}

export function useCollaboratorAbsences(id: string) {
  return useQuery({
    queryKey: collaboratorKeys.absences(id),
    queryFn: () => apiFetch<Absence[]>(`/collaborators/${id}/absences`),
    enabled: !!id,
  });
}

export function useCreateCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Collaborator>) =>
      apiFetch<Collaborator>("/collaborators", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: collaboratorKeys.all }),
  });
}

export function useUpdateCollaborator(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Collaborator>) =>
      apiFetch<Collaborator>(`/collaborators/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: collaboratorKeys.detail(id) });
      qc.invalidateQueries({ queryKey: collaboratorKeys.all });
    },
  });
}

export function useDeleteCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/collaborators/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: collaboratorKeys.all }),
  });
}

export function useAddAbsence(collaboratorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { startDate: string; endDate: string; reason?: string }) =>
      apiFetch(`/collaborators/${collaboratorId}/absences`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: collaboratorKeys.absences(collaboratorId) }),
  });
}

export function useDeleteAbsence(collaboratorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (absenceId: string) =>
      apiFetch(`/collaborators/${collaboratorId}/absences/${absenceId}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: collaboratorKeys.absences(collaboratorId) }),
  });
}
