"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Check, X, Zap, Star, Building2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

type MeData = { business: { plan: string; planStatus: string } };

const PLANS = [
  {
    key: "BASIC",
    label: "Básico",
    price: 29,
    icon: Zap,
    color: "text-blue-600",
    border: "border-blue-200",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    btnClass: "bg-blue-600 hover:bg-blue-700 text-white",
    features: [
      { text: "2 colaboradores", included: true },
      { text: "Hasta 50 citas por mes", included: true },
      { text: "Agendar hasta 7 días de anticipación", included: true },
      { text: "Historial de clientes (30 días)", included: true },
      { text: "Reportes básicos", included: true },
      { text: "Registro de anticipos", included: false },
      { text: "Paquetes de servicios", included: false },
      { text: "Exportar reportes a Excel", included: false },
      { text: "Soporte prioritario", included: false },
    ],
  },
  {
    key: "PRO",
    label: "Pro",
    price: 39,
    icon: Star,
    color: "text-[var(--color-primary)]",
    border: "border-[var(--color-primary)]/40",
    badge: "bg-[var(--color-primary-container)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/30",
    btnClass: "bg-[var(--color-primary)] hover:bg-[var(--color-on-primary-fixed-variant)] text-[var(--color-on-primary)]",
    popular: true,
    features: [
      { text: "4 colaboradores", included: true },
      { text: "Hasta 200 citas por mes", included: true },
      { text: "Agendar hasta 30 días de anticipación", included: true },
      { text: "Historial de clientes (6 meses)", included: true },
      { text: "Reportes completos", included: true },
      { text: "Paquetes de servicios (hasta 5)", included: true },
      { text: "Registro de anticipos", included: true },
      { text: "Exportar reportes a Excel", included: true },
      { text: "Soporte prioritario", included: false },
    ],
  },
  {
    key: "ENTERPRISE",
    label: "Enterprise",
    price: 45,
    icon: Building2,
    color: "text-emerald-600",
    border: "border-emerald-200",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    features: [
      { text: "Colaboradores ilimitados", included: true },
      { text: "Citas ilimitadas", included: true },
      { text: "Agendar sin límite de anticipación", included: true },
      { text: "Historial completo de clientes", included: true },
      { text: "Reportes completos", included: true },
      { text: "Paquetes de servicios ilimitados", included: true },
      { text: "Registro de anticipos", included: true },
      { text: "Exportar reportes a Excel", included: true },
      { text: "Soporte prioritario", included: true },
    ],
  },
];

export default function PlanesPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<(typeof PLANS)[0] | null>(null);

  const { data: me } = useQuery<MeData>({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeData>("/auth/me"),
  });

  const currentPlan = me?.business?.plan ?? null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-surface-container-low)]">
      <Sidebar activePath="/planes" />

      <div className="ml-64 flex flex-1 flex-col overflow-hidden">
        <TopBar hideSearch />

        <main className="flex-1 overflow-y-auto pt-16">
          {/* Barra de título con flecha */}
          <div className="sticky top-0 z-10 flex items-center gap-3 px-8 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)]">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-[var(--color-surface-container-high)] transition-colors text-[var(--color-on-surface-variant)] shrink-0"
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="font-headline-sm font-semibold text-[var(--color-on-surface)]">
                Planes de suscripción
              </h1>
              <p className="text-[12px] text-[var(--color-on-surface-variant)]">
                Pago mensual · Sin contratos · Activa tu plan en minutos
              </p>
            </div>
          </div>

          <div className="px-8 py-8">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Cards de planes */}
            <div className="grid grid-cols-3 gap-5">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = currentPlan === plan.key || (currentPlan === "TRIAL" && plan.key === "BASIC");
                return (
                  <div
                    key={plan.key}
                    className={`relative bg-[var(--color-surface-container-lowest)] border-2 rounded-2xl p-6 flex flex-col gap-5 transition-shadow hover:shadow-md ${plan.border} ${plan.popular ? "ring-2 ring-[var(--color-primary)]/30" : ""}`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] text-[11px] font-semibold px-3 py-1 rounded-full border border-[var(--color-outline-variant)]">
                          Plan actual
                        </span>
                      </div>
                    )}
                    {!isCurrentPlan && plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[11px] font-semibold px-3 py-1 rounded-full">
                          Más popular
                        </span>
                      </div>
                    )}

                    {/* Plan info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon size={18} className={plan.color} strokeWidth={1.8} />
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${plan.badge}`}>
                          {plan.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 pt-2">
                        <span className="text-[var(--color-on-surface-variant)] text-body-md">S/</span>
                        <span className="font-headline-md text-headline-md text-[var(--color-on-surface)]">{plan.price}</span>
                        <span className="text-[var(--color-on-surface-variant)] text-body-md">/mes</span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 flex-1">
                      {plan.features.map((f) => (
                        <li key={f.text} className="flex items-center gap-2 text-body-md">
                          {f.included
                            ? <Check size={15} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                            : <X size={15} className="text-[var(--color-outline)] shrink-0" strokeWidth={2} />
                          }
                          <span className={f.included ? "text-[var(--color-on-surface)]" : "text-[var(--color-outline)]"}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Botón */}
                    {isCurrentPlan ? (
                      <div className="w-full py-2.5 rounded-xl text-label-md font-semibold text-center bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
                        Plan activo
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedPlan(plan)}
                        className={`w-full py-2.5 rounded-xl text-label-md font-semibold transition-colors ${plan.btnClass}`}
                      >
                        Seleccionar {plan.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Nota informativa */}
            <p className="text-center text-[12px] text-[var(--color-on-surface-variant)]">
              Luego de realizar el pago, tu plan se activará en un máximo de <strong>24 horas hábiles</strong>.
            </p>
          </div>
          </div>
        </main>
      </div>

      {/* Modal de pago */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 w-full max-w-sm shadow-xl space-y-3 max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {/* Header modal */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-[var(--color-on-surface)]">
                  Pagar plan {selectedPlan.label}
                </h2>
                <p className="text-body-md text-[var(--color-on-surface-variant)]">S/ {selectedPlan.price} / mes</p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-2 rounded-full hover:bg-[var(--color-surface-container-high)] transition-colors text-[var(--color-on-surface-variant)]"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* QR */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white rounded-xl border border-[var(--color-outline-variant)] overflow-hidden w-full" style={{ height: 200 }}>
                <Image
                  src="/qr-plin.jpeg"
                  alt="QR Plin"
                  width={380}
                  height={600}
                  className="w-full object-cover"
                  style={{ objectPosition: "center 42%", height: 200 }}
                />
              </div>
              <div className="text-center">
                <p className="text-label-md font-semibold text-[var(--color-on-surface)]">Edgar Russbel Huaman Ramos</p>
                <p className="text-[12px] text-[var(--color-on-surface-variant)]">Plin · 922 358 205</p>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-[var(--color-surface-container-low)] rounded-xl p-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">¿Cómo pagar?</p>
              <ol className="space-y-1 text-body-md text-[var(--color-on-surface-variant)]">
                <li className="flex gap-2"><span className="text-[var(--color-primary)] font-semibold">1.</span> Abre la app de tu banco</li>
                <li className="flex gap-2"><span className="text-[var(--color-primary)] font-semibold">2.</span> Elige <strong>Pago con QR</strong> o <strong>Plin</strong></li>
                <li className="flex gap-2"><span className="text-[var(--color-primary)] font-semibold">3.</span> Escanea el código e ingresa <strong>S/ {selectedPlan.price}</strong></li>
                <li className="flex gap-2"><span className="text-[var(--color-primary)] font-semibold">4.</span> Envíanos el comprobante</li>
              </ol>
            </div>

            <p className="text-center text-[11px] text-[var(--color-on-surface-variant)]">
              Tu plan se activará en un máximo de 24 horas hábiles tras confirmar el pago.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
