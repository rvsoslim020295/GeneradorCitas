import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type AnalyticsData = {
  kpis: {
    totalAppointments: number;
    totalAppointmentsPrev: number;
    completedAppointments: number;
    completedAppointmentsPrev: number;
    totalRevenue: number;
    totalRevenuePrev: number;
    noShowRate: number;
    noShowRatePrev: number | null;
  };
  dailyRevenue: { day: string; amount: number }[];
  statusDistribution: { completed: number; pending: number; cancelled: number };
  topCollaborators: {
    name: string;
    revenue: number;
    appointmentCount: number;
    percentage: number;
  }[];
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
