"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { AlertTriangle, ArrowRight, LogOut } from "lucide-react";

type MeData = {
  name: string;
  business: { name: string; planStatus: string };
};

const STATUS_COPY: Record<string, { title: string; description: string; color: string }> = {
  EXPIRED: {
    title: "Tu plan ha vencido",
    description:
      "El período de acceso de tu negocio ha expirado. Para seguir gestionando citas, clientes y reportes, elige un plan y realiza el pago.",
    color: "text-amber-600",
  },
  SUSPENDED: {
    title: "Tu cuenta está suspendida",
    description:
      "Tu negocio ha sido suspendido temporalmente. Contáctanos o elige un plan para reactivar tu acceso.",
    color: "text-red-600",
  },
};

export default function PlanVencidoPage() {
  const router = useRouter();

  const { data: me } = useQuery<MeData>({
    queryKey: ["me-plan-vencido"],
    queryFn: () => apiFetch("/auth/me"),
  });

  const status = me?.business?.planStatus ?? "EXPIRED";
  const copy = STATUS_COPY[status] ?? STATUS_COPY.EXPIRED;

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" });
    localStorage.removeItem("gm_user");
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-md text-center">
        <div className="mb-6 flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-error-container/30">
            <AlertTriangle size={32} className={copy.color} strokeWidth={1.5} />
          </span>
        </div>

        <h1 className={`font-headline-md text-headline-md mb-3 ${copy.color}`}>
          {copy.title}
        </h1>

        {me?.business?.name && (
          <p className="mb-2 font-label-md text-label-md text-on-surface-variant">
            {me.business.name}
          </p>
        )}

        <p className="font-body-md text-body-md text-on-surface-variant mb-8">
          {copy.description}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/planes")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-label-md text-label-md text-on-primary transition hover:opacity-90"
          >
            Ver planes disponibles
            <ArrowRight size={18} />
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container px-4 py-3 font-label-md text-label-md text-on-surface transition hover:bg-surface-container-high"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>

        <p className="mt-6 font-body-sm text-body-sm text-on-surface-variant">
          ¿Necesitas ayuda? Escríbenos al WhatsApp del soporte.
        </p>
      </div>
    </main>
  );
}
