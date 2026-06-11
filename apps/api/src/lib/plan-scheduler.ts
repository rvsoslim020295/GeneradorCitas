import cron from "node-cron";
import prisma from "./prisma.js";

// Expira automáticamente los trials vencidos (auditoría 4.2).
// Sin esto, un negocio TRIAL conserva acceso indefinidamente tras los 7 días.
// Combinado con requirePlanAccess (4.1), un trial EXPIRED pasa a solo-lectura.
async function expireTrials() {
  const result = await prisma.business.updateMany({
    where: {
      plan: "TRIAL",
      planStatus: "ACTIVE",
      trialEndsAt: { lt: new Date() },
    },
    data: { planStatus: "EXPIRED" },
  });
  if (result.count > 0) {
    console.log(`[PlanScheduler] ${result.count} trial(es) vencido(s) marcados como EXPIRED`);
  }
}

export function startPlanScheduler() {
  // Cada día a las 03:00
  cron.schedule("0 3 * * *", async () => {
    try {
      await expireTrials();
    } catch (err) {
      console.error("[PlanScheduler] Error expirando trials:", err);
    }
  });
  // Una pasada al arrancar para no esperar al primer cron tras un deploy
  expireTrials().catch((err) => console.error("[PlanScheduler] Error en pasada inicial:", err));
  console.log("[PlanScheduler] Expiración automática de trials activa (diaria 03:00)");
}
