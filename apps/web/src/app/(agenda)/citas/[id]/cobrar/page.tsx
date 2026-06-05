"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  X, Clock, CreditCard, Banknote, Building2, QrCode, Check, Lock,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type PaymentMethod = "card" | "cash" | "transfer" | "app";

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  depositAmount: number | null;
  client: { name: string; phone: string | null };
  collaborator: { name: string };
  service: { name: string };
};

const TIP_OPTIONS = [
  { label: "0%", value: 0 },
  { label: "10%", value: 0.1 },
  { label: "15%", value: 0.15 },
  { label: "20%", value: 0.2 },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: "card", label: "Tarjeta", icon: CreditCard },
  { id: "cash", label: "Efectivo", icon: Banknote },
  { id: "transfer", label: "Transferencia", icon: Building2 },
  { id: "app", label: "Yape / Plin", icon: QrCode },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function shortName(name: string) {
  const p = name.split(" ");
  return p[0] + (p[1] ? " " + p[1][0] + "." : "");
}

export default function CobrarPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipPercent, setTipPercent] = useState(0);
  const [tipMode, setTipMode] = useState<"percent" | "amount">("percent");
  const [tipCustom, setTipCustom] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/appointments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setAppointment)
      .catch(() => router.push("/agenda"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleConfirm() {
    const token = localStorage.getItem("gm_token");
    if (!token || confirming) return;

    setConfirming(true);
    try {
      const res = await fetch(`${API_URL}/appointments/${id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tipPercent: tipMode === "percent" ? tipPercent : tipAmount / balance,
          paymentMethod,
        }),
      });

      if (res.ok) {
        router.push("/agenda");
      }
    } finally {
      setConfirming(false);
    }
  }

  if (loading || !appointment) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-surface-bright)]">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const servicePrice = appointment.price;
  const deposit = appointment.depositAmount ?? 0;
  const balance = servicePrice - deposit;
  const tipAmount =
    tipMode === "percent" ? balance * tipPercent : parseFloat(tipCustom || "0");
  const total = balance + (isNaN(tipAmount) ? 0 : tipAmount);

  return (
    <div className="bg-[var(--color-surface)] text-[var(--color-on-surface)] h-screen flex flex-col overflow-hidden">
      <div className="w-full max-w-md mx-auto h-full flex flex-col bg-[var(--color-surface-bright)] shadow-2xl relative overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-outline-variant)]/30 z-10 sticky top-0">
          <Link
            href={`/citas/${id}`}
            className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface-container-low)] transition-colors text-[var(--color-on-surface)] flex items-center justify-center"
          >
            <X size={22} strokeWidth={1.5} />
          </Link>
          <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
            Registrar Pago
          </h1>
          <div className="w-10" />
        </header>

        {/* Contenido scrolleable */}
        <main className="flex-1 overflow-y-auto pb-36" style={{ scrollbarWidth: "none" }}>

          {/* Contexto del cliente */}
          <section className="p-4 flex items-center gap-4 border-b border-[var(--color-outline-variant)]/20 bg-[var(--color-surface-container-lowest)]">
            <div className="w-12 h-12 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center text-headline-sm font-semibold shrink-0">
              {appointment.client.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
            </div>
            <div>
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] leading-tight">
                {appointment.client.name}
              </h2>
              <p className="text-body-md text-[var(--color-on-surface-variant)] flex items-center gap-1 mt-0.5">
                <Clock size={14} strokeWidth={1.5} />
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
              </p>
            </div>
          </section>

          <div className="p-4 space-y-6">
            {/* Resumen de servicio (ticket) */}
            <section>
              <h3 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] mb-3 uppercase tracking-wider">
                Resumen de Servicio
              </h3>
              <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-sm border border-[var(--color-outline-variant)]/30 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-body-lg font-medium text-[var(--color-on-surface)]">
                      {appointment.service.name}
                    </p>
                    <p className="text-body-md text-[var(--color-on-surface-variant)]">
                      Estilista: {shortName(appointment.collaborator.name)}
                    </p>
                  </div>
                  <p className="text-body-lg text-[var(--color-on-surface)]">
                    S/{servicePrice.toLocaleString("es-PE")}
                  </p>
                </div>
                {deposit > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <p className="text-body-md flex items-center gap-1">
                      <span className="text-lg leading-none">−</span> Anticipo pagado
                    </p>
                    <p className="text-body-md font-medium">−S/{deposit.toLocaleString("es-PE")}</p>
                  </div>
                )}
                <div className="border-t border-[var(--color-outline-variant)]/40 pt-3 flex justify-between items-center">
                  <p className="text-body-md text-[var(--color-on-surface-variant)]">
                    {deposit > 0 ? "Saldo pendiente" : "Subtotal"}
                  </p>
                  <p className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
                    S/{balance.toLocaleString("es-PE")}
                  </p>
                </div>
              </div>
            </section>

            {/* Selector de propina */}
            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                  Agregar Propina
                </h3>
                <p className="text-label-md font-semibold text-[var(--color-primary)]">
                  +S/{(isNaN(tipAmount) ? 0 : tipAmount).toFixed(0)}
                </p>
              </div>

              {/* Toggle modo propina */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setTipMode("percent")}
                  className={`py-2 rounded-lg text-label-md font-medium border transition-all ${
                    tipMode === "percent"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]"
                      : "border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)]"
                  }`}
                >
                  Porcentaje
                </button>
                <button
                  onClick={() => setTipMode("amount")}
                  className={`py-2 rounded-lg text-label-md font-medium border transition-all ${
                    tipMode === "amount"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]"
                      : "border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)]"
                  }`}
                >
                  Monto fijo
                </button>
              </div>

              {tipMode === "percent" ? (
                <div className="grid grid-cols-4 gap-2">
                  {TIP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTipPercent(opt.value)}
                      className={`h-12 flex items-center justify-center rounded-lg border transition-all text-body-md font-medium ${
                        tipPercent === opt.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/20 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                          : "border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] hover:border-[var(--color-primary)]/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] text-body-md font-medium">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={tipCustom}
                    onChange={(e) => setTipCustom(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] text-body-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
              )}
            </section>

            {/* Selector de método de pago */}
            <section>
              <h3 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] mb-3 uppercase tracking-wider">
                Método de Pago
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(({ id: methodId, label, icon: Icon }) => {
                  const selected = paymentMethod === methodId;
                  return (
                    <button
                      key={methodId}
                      onClick={() => setPaymentMethod(methodId)}
                      className={`relative p-4 rounded-xl border shadow-sm transition-all flex flex-col items-start gap-3 text-left ${
                        selected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/10"
                          : "border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] hover:shadow-md"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center transition-colors ${selected ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"}`}>
                        <Icon size={20} strokeWidth={1.5} />
                      </div>
                      <span className="text-body-md font-medium text-[var(--color-on-surface)]">{label}</span>

                      {/* Check indicator */}
                      <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                        selected
                          ? "bg-[var(--color-primary)] border-[var(--color-primary)] opacity-100"
                          : "border-[var(--color-outline-variant)] opacity-0"
                      }`}>
                        <Check size={12} strokeWidth={2.5} className="text-white" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </main>

        {/* Footer fijo */}
        <div className="absolute bottom-0 w-full bg-[var(--color-surface-bright)]/90 backdrop-blur-xl border-t border-[var(--color-outline-variant)]/30 px-4 py-5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 rounded-t-2xl">
          <div className="flex justify-between items-end mb-4">
            <span className="text-body-lg text-[var(--color-on-surface-variant)]">
              {deposit > 0 ? "Saldo a Cobrar" : "Total a Pagar"}
            </span>
            <span className="text-display-lg font-bold text-[var(--color-primary)] tracking-tight leading-none">
              S/{total.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-on-primary-fixed-variant)] active:scale-[0.98] text-[var(--color-on-primary)] text-headline-sm font-semibold h-14 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Lock size={18} strokeWidth={1.5} />
            {confirming ? "Procesando..." : "Confirmar Pago y Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
