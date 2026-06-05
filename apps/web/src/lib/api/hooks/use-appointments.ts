import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  price: number;
  notes: string | null;
  tipPercent: number | null;
  paymentMethod: string | null;
  depositAmount: number | null;
  client: { id: string; name: string; lastName: string | null; phone: string | null };
  collaborator: { id: string; name: string; lastName: string | null };
  service: { id: string; name: string; durationMin: number; color: string };
};

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: (params?: Record<string, string>) =>
    ["appointments", "list", params ?? {}] as const,
  detail: (id: string) => ["appointments", "detail", id] as const,
};

export function useAppointments(params?: Record<string, string>) {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return apiFetch<Appointment[]>(`/appointments${qs}`);
    },
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => apiFetch<Appointment>(`/appointments/${id}`),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      clientId: string;
      collaboratorId: string;
      serviceId: string;
      startTime: string;
      endTime: string;
      price: number;
      notes?: string;
    }) =>
      apiFetch<Appointment>("/appointments", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
}

export function useRegisterPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { tipPercent?: number; tipAmount?: number; paymentMethod: string };
    }) =>
      apiFetch(`/appointments/${id}/payment`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: appointmentKeys.list() });
    },
  });
}

export function useRegisterDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { amount: number };
    }) =>
      apiFetch(`/appointments/${id}/deposit`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
    },
  });
}
