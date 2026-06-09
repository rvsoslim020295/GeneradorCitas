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
  heatmap: { day: number; hour: number; count: number }[];
  newVsRecurring: { new: number; recurring: number; newPct: number; recurringPct: number; total: number } | null;
  bestMonth: { month: string; amount: number; appointments: number } | null;
  topServices: { name: string; count: number; revenue: number; percentage: number }[];
  topClients: { name: string; visits: number; revenue: number }[];
  originBreakdown: { id: string; label: string; count: number; percentage: number }[];
  cancellationByCollaborator: { name: string; cancelled: number; total: number; rate: number }[];
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
