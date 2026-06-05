import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type Notification = {
  id: string;
  type: string;
  message: string;
  appointmentId: string;
  clientName: string;
  time: string;
};

export const notificationKeys = {
  all: ["notifications"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => apiFetch<Notification[]>("/notifications"),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // polling cada minuto
  });
}
