import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type CollaboratorStat = {
  name: string;
  serviceRevenue: number;
  tipRevenue: number;
  totalRevenue: number;
  appointmentCount: number;
  percentage: number;
};

export type AnalyticsData = {
  kpis: {
    totalAppointments: number;
    totalAppointmentsPrev: number;
    completedAppointments: number;
    completedAppointmentsPrev: number;
    cancelledCount: number;
    noShowCount: number;
    rescheduledCount: number;
    serviceRevenue: number;
    tipRevenue: number;
    totalRevenue: number;
    totalRevenuePrev: number;
    tipRevenuePrev: number;
    noShowRate: number;
    noShowRatePrev: number | null;
  };
  chartType: "daily" | "weekly" | "monthly";
  dailyRevenue: { day: string; amount: number }[];
  statusDistribution: { completed: number; pending: number; cancelled: number };
  topCollaborators: CollaboratorStat[];
  allCollaborators: CollaboratorStat[];
};

export const analyticsKeys = {
  all: ["analytics"] as const,
  byPeriod: (period: string) => ["analytics", period] as const,
};

export function useAnalytics(period: string) {
  return useQuery({
    queryKey: analyticsKeys.byPeriod(period),
    queryFn: () => apiFetch<AnalyticsData>(`/analytics?period=${period}`),
    staleTime: 1000 * 30, // 30s para analytics
  });
}
