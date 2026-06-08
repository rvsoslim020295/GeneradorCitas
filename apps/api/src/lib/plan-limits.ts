export type PlanType = "TRIAL" | "BASIC" | "PRO" | "ENTERPRISE";

export const PLAN_LIMITS: Record<PlanType, {
  maxCollaborators: number;        // -1 = ilimitado
  maxAppointmentsPerMonth: number; // -1 = ilimitado
  maxAdvanceDays: number;          // -1 = sin límite
  clientHistoryDays: number;       // -1 = historial completo
  canUseDeposits: boolean;         // registro de anticipos
  canExportExcel: boolean;         // exportar reportes a Excel
  maxPackages: number;             // -1 = ilimitado
}> = {
  TRIAL:      { maxCollaborators: 2,  maxAppointmentsPerMonth: 50,  maxAdvanceDays: 7,  clientHistoryDays: 30,  canUseDeposits: false, canExportExcel: false, maxPackages: 0  },
  BASIC:      { maxCollaborators: 2,  maxAppointmentsPerMonth: 50,  maxAdvanceDays: 7,  clientHistoryDays: 30,  canUseDeposits: false, canExportExcel: false, maxPackages: 0  },
  PRO:        { maxCollaborators: 4,  maxAppointmentsPerMonth: 200, maxAdvanceDays: 30, clientHistoryDays: 180, canUseDeposits: true,  canExportExcel: true,  maxPackages: 5  },
  ENTERPRISE: { maxCollaborators: -1, maxAppointmentsPerMonth: -1,  maxAdvanceDays: -1, clientHistoryDays: -1,  canUseDeposits: true,  canExportExcel: true,  maxPackages: -1 },
};

export function getLimits(plan: string) {
  return PLAN_LIMITS[(plan as PlanType)] ?? PLAN_LIMITS.BASIC;
}
