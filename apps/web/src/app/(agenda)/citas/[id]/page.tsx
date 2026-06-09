"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  X, MessageSquare, Clock, User,
  CreditCard, CalendarClock, XCircle, UserX, History,
  CheckCircle, DollarSign,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import {
  useAppointment,
  useUpdateAppointmentStatus,
  useRegisterDeposit,
  useSettings,
} from "@/lib/api/hooks";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";

const statusConfig: Record<AppointmentStatus, { label: string; bg: string; dot: string; text: string }> = {
  PENDING:     { label: "Pendiente",      bg: "bg-[var(--color-tertiary-fixed)]/30 border-[var(--color-tertiary-fixed)]",   dot: "bg-[var(--color-tertiary)]",   text: "text-[var(--color-tertiary)]" },
  CONFIRMED:   { label: "Confirmada",     bg: "bg-[var(--color-secondary-fixed)]/30 border-[var(--color-secondary-fixed)]", dot: "bg-[var(--color-secondary)]", text: "text-[var(--color-secondary)]" },
  IN_PROGRESS: { label: "En progreso",    bg: "bg-blue-50 border-blue-200",         dot: "bg-blue-500",    text: "text-blue-700" },
  COMPLETED:   { label: "Completada",     bg: "bg-emerald-50 border-emerald-200",   dot: "bg-emerald-500", text: "text-emerald-700" },
  CANCELLED:   { label: "Cancelada",      bg: "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)]", dot: "bg-[var(--color-error)]", text: "text-[var(--color-error)]" },
  NO_SHOW:     { label: "No se presentó", bg: "bg-[var(--color-surface-variant)] border-[var(--color-outline-variant)]",   dot: "bg-[var(--color-outline)]", text: "text-[var(--color-on-surface-variant)]" },
  RESCHEDULED: { label: "Reagendada",     bg: "bg-orange-50 border-orange-200",     dot: "bg-orange-500",  text: "text-orange-700" },
};

const MOCK_TIMELINE = [
  { label: "Cita Confirmada",      detail: "Hoy, 09:15 AM • Vía WhatsApp", active: true },
  { label: "Recordatorio enviado", detail: "Ayer, 10:00 AM • SMS Automático", active: false },
  { label: "Cita Creada",          detail: "Hace 3 días • Por Recepción",   active: false },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const DEFAULT_TEMPLATES = {
  confirmation: `Hola {cliente}, ✅ tu cita está confirmada en {negocio}.\n\n📅 {fecha} a las {hora}\n✂️ {servicio} con {colaborador}\n💰 S/{precio}\n\n¡Te esperamos!`,
  reminder:     `Hola {cliente}, 🔔 te recordamos tu cita de mañana en {negocio}.\n\n📅 {fecha} a las {hora}\n✂️ {servicio} con {colaborador}\n\nSi necesitas reagendar escríbenos. ¡Hasta mañana!`,
  payment:      `Hola {cliente}, 💳 tu servicio de {servicio} quedó pendiente de pago.\n\n💰 Total: S/{precio}\n📍 {negocio}\n\nPor favor acércate a cancelar cuando puedas. ¡Gracias!`,
};

function buildWaMessage(
  template: string | null | undefined,
  defaultTpl: string,
  vars: Record<string, string>,
): string {
  const tpl = template || defaultTpl;
  return Object.entries(vars).reduce((msg, [k, v]) => msg.replaceAll(k, v), tpl);
}

function buildWhatsAppUrl(phone: string | null, message?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("51") ? digits : `51${digits}`;
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export default function CitaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [actionError, setActionError] = useState("");
  const [showDeposit, setShowDeposit] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [depositMode, setDepositMode] = useState<"percent" | "amount">("percent");
  const [depositPercent, setDepositPercent] = useState(30);
  const [depositCustom, setDepositCustom] = useState("");

  const { data: appointment, isLoading } = useAppointment(id);
  const { data: settings } = useSettings();
  const updateStatus = useUpdateAppointmentStatus();
  const registerDeposit = useRegisterDeposit();

  async function executeUpdateStatus(status: AppointmentStatus) {
    setActionError("");
    try {
      await updateStatus.mutateAsync({ id, status });
      if (status === "CANCELLED" || status === "NO_SHOW") {
        setTimeout(() => router.push("/agenda"), 800);
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "No se pudo actualizar la cita.";
      try {
        const body = JSON.parse(raw);
        setActionError(body.error ?? raw);
      } catch {
        setActionError(raw);
      }
    }
  }

  function handleUpdateStatus(status: AppointmentStatus, confirmMsg?: string, afterConfirm?: () => void) {
    if (confirmMsg) {
      setConfirmDialog({
        message: confirmMsg,
        onConfirm: async () => {
          await executeUpdateStatus(status);
          afterConfirm?.();
        },
      });
    } else {
      executeUpdateStatus(status);
    }
  }

  async function handleSaveDeposit() {
    if (!appointment) return;
    const amount =
      depositMode === "percent"
        ? appointment.price * (depositPercent / 100)
        : parseFloat(depositCustom);
    if (!amount || amount <= 0) return;
    if (amount > appointment.price) {
      setActionError(`El anticipo no puede superar el precio del servicio (S/${appointment.price.toFixed(2)}).`);
      return;
    }

    setActionError("");
    try {
      await registerDeposit.mutateAsync({ id, body: { amount } });
      setShowDeposit(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "No se pudo registrar el anticipo.");
    }
  }

  const status = appointment ? statusConfig[appointment.status] : null;

  // WhatsApp URLs con mensajes pre-llenados
  const waVars = appointment ? {
    "{cliente}":     appointment.client.name,
    "{negocio}":     settings?.name ?? "el negocio",
    "{fecha}":       new Date(appointment.startTime).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" }),
    "{hora}":        formatTime(appointment.startTime),
    "{servicio}":    appointment.service.name,
    "{colaborador}": appointment.collaborator.name,
    "{precio}":      appointment.price.toFixed(2),
  } : null;

  const waConfirmationUrl = waVars ? buildWhatsAppUrl(appointment!.client.phone, buildWaMessage(settings?.waTplConfirmation, DEFAULT_TEMPLATES.confirmation, waVars)) : null;
  const waReminderUrl     = waVars ? buildWhatsAppUrl(appointment!.client.phone, buildWaMessage(settings?.waTplReminder,     DEFAULT_TEMPLATES.reminder,     waVars)) : null;
  const waPaymentUrl      = waVars ? buildWhatsAppUrl(appointment!.client.phone, buildWaMessage(settings?.waTplPayment,      DEFAULT_TEMPLATES.payment,      waVars)) : null;
  const depositAmount =
    appointment && depositMode === "percent"
      ? appointment.price * (depositPercent / 100)
      : parseFloat(depositCustom || "0");

  const updating = updateStatus.isPending;
  const savingDeposit = registerDeposit.isPending;

  return (
    <>
      {/* Modal de confirmación en página */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
          <div className="relative bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <p className="font-body-md text-body-md text-[var(--color-on-surface)] text-center leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-label-md text-label-md hover:bg-[var(--color-surface-container-high)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-label-md text-label-md hover:opacity-90 transition-opacity"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar activePath="/agenda" />

      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-surface-bright)] relative overflow-hidden">
        <TopBar searchPlaceholder="Buscar citas, clientes..." />

        <div className="flex flex-col flex-1 overflow-hidden pt-16 opacity-40 blur-sm pointer-events-none select-none">
          <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)]">
            <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Agenda Semanal</h2>
          </div>
          <div className="flex-1 m-6 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] flex items-center justify-center">
            <p className="text-body-md text-[var(--color-outline)]">Vista de Agenda Principal</p>
          </div>
        </div>

        <div
          className="absolute inset-0 bg-[var(--color-on-background)]/20 backdrop-blur-[3px] z-30 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) router.push("/agenda"); }}
        >
          <div
            className="relative w-full max-w-[480px] max-h-[90vh] bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-2xl border border-[var(--color-outline-variant)] flex flex-col overflow-hidden mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 px-6 flex items-center justify-between border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)]/60 backdrop-blur-md shrink-0">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
                Detalle de Cita
              </h2>
              <Link
                href="/agenda"
                className="p-2 rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors"
              >
                <X size={20} strokeWidth={1.5} />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : appointment && status ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "thin" }}>

                <div className="flex items-center justify-between">
                  <div className={`${status.bg} border rounded-full px-4 py-1.5 flex items-center gap-2`}>
                    <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                    <span className={`text-label-md font-semibold uppercase tracking-wider ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                  <span className="text-label-md text-[var(--color-on-surface-variant)]">
                    Ref: #{appointment.id.slice(-6).toUpperCase()}
                  </span>
                </div>

                <div className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-outline-variant)] shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] font-semibold text-headline-sm shrink-0">
                      {getInitials(appointment.client.name)}
                    </div>
                    <div>
                      <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
                        {appointment.client.name}
                      </h3>
                      <p className="text-body-md text-[var(--color-on-surface-variant)] mt-0.5">
                        {appointment.client.phone ?? "Sin teléfono"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-label-md font-semibold text-[var(--color-outline)] uppercase tracking-widest">
                    Información del Servicio
                  </h4>
                  <div className="bg-[var(--color-surface-container-low)] rounded-xl p-5 border border-[var(--color-outline-variant)]/50 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
                          {appointment.service.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-headline-md font-semibold text-[var(--color-on-surface)]">
                          S/{appointment.price.toLocaleString("es-PE")}
                        </span>
                        {appointment.depositAmount && (
                          <p className="text-label-md text-emerald-600 mt-0.5">
                            Anticipo: S/{appointment.depositAmount.toFixed(0)}
                          </p>
                        )}
                      </div>
                    </div>
                    <hr className="border-[var(--color-outline-variant)]/50" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-label-md text-[var(--color-outline)] mb-1">Horario</p>
                        <div className="flex items-center gap-2 text-[var(--color-on-surface)]">
                          <Clock size={16} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                          <span className="text-body-md font-medium">
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </span>
                        </div>
                        <p className="text-label-md text-[var(--color-on-surface-variant)] mt-1 ml-6">
                          {appointment.service.durationMin} min de duración
                        </p>
                      </div>
                      <div>
                        <p className="text-label-md text-[var(--color-outline)] mb-1">Colaborador</p>
                        <div className="flex items-center gap-2 text-[var(--color-on-surface)]">
                          <User size={16} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                          <span className="text-body-md font-medium">
                            {appointment.collaborator.name.split(" ")[0]}{" "}
                            {appointment.collaborator.name.split(" ").slice(-1)[0][0]}.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(appointment.status) && (
                  <div className="space-y-3 pt-1">
                    {actionError && (
                      <div className="text-body-md text-[var(--color-error)] bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-3 py-2">
                        {actionError}
                      </div>
                    )}

                    {/* Badges de estado pendiente — independientes entre sí */}
                    <div className="flex flex-wrap gap-2">
                      {!appointment.paidAmount && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                          <CreditCard size={11} strokeWidth={2} />
                          Pago pendiente
                        </span>
                      )}
                      {appointment.status !== "COMPLETED" && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-50 border border-blue-200 text-blue-700">
                          <CheckCircle size={11} strokeWidth={2} />
                          Servicio pendiente de completar
                        </span>
                      )}
                      {appointment.paidAmount && appointment.status === "COMPLETED" && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                          <CheckCircle size={11} strokeWidth={2} />
                          Todo listo ✓
                        </span>
                      )}
                    </div>

                    {/* Iniciar servicio */}
                    {appointment.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleUpdateStatus("IN_PROGRESS")}
                        disabled={updating}
                        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-label-md font-semibold py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
                      >
                        <Clock size={16} strokeWidth={1.5} />
                        {updating ? "..." : "Iniciar servicio"}
                      </button>
                    )}

                    {/* Cobrar y Completar — aparecen de forma independiente */}
                    <div className="grid grid-cols-2 gap-3">
                      {!appointment.paidAmount && (
                        <Link
                          href={`/citas/${appointment.id}/cobrar`}
                          className="bg-[var(--color-primary)] hover:bg-[var(--color-on-primary-fixed-variant)] text-[var(--color-on-primary)] text-label-lg font-semibold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                          <CreditCard size={18} strokeWidth={1.5} />
                          Cobrar
                        </Link>
                      )}
                      {appointment.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleUpdateStatus("COMPLETED")}
                          disabled={updating}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-label-lg font-semibold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
                        >
                          <CheckCircle size={18} strokeWidth={1.5} />
                          {updating ? "..." : "Completar"}
                        </button>
                      )}
                    </div>

                    {appointment.status !== "COMPLETED" && (!showDeposit ? (
                      <button
                        onClick={() => setShowDeposit(true)}
                        className="w-full bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] text-label-md font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <DollarSign size={16} strokeWidth={1.5} />
                        {appointment.depositAmount
                          ? `Actualizar Anticipo (S/${appointment.depositAmount.toFixed(0)})`
                          : "Registrar Anticipo"}
                      </button>
                    ) : (
                      <div className="bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-label-md font-semibold text-[var(--color-on-surface)]">Anticipo</h4>
                          <button onClick={() => setShowDeposit(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors">
                            <X size={16} strokeWidth={1.5} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {["percent", "amount"].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setDepositMode(mode as "percent" | "amount")}
                              className={`py-2 rounded-lg text-label-md font-medium border transition-all ${
                                depositMode === mode
                                  ? "bg-[var(--color-primary-container)]/20 border-[var(--color-primary)] text-[var(--color-primary)]"
                                  : "border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]"
                              }`}
                            >
                              {mode === "percent" ? "Por porcentaje" : "Monto fijo"}
                            </button>
                          ))}
                        </div>

                        {depositMode === "percent" ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-4 gap-2">
                              {[20, 30, 50, 100].map((p) => (
                                <button
                                  key={p}
                                  onClick={() => setDepositPercent(p)}
                                  className={`py-2 rounded-lg text-label-md font-medium border transition-all ${
                                    depositPercent === p
                                      ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]"
                                      : "border-[var(--color-outline-variant)] text-[var(--color-on-surface)]"
                                  }`}
                                >
                                  {p}%
                                </button>
                              ))}
                            </div>
                            <p className="text-body-md text-[var(--color-on-surface-variant)] text-center">
                              = S/{(appointment.price * depositPercent / 100).toFixed(2)} de S/{appointment.price.toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] text-body-md font-medium">S/</span>
                            <input
                              type="number" min="0" step="0.50"
                              value={depositCustom}
                              onChange={(e) => setDepositCustom(e.target.value)}
                              className={`w-full pl-9 pr-4 py-2.5 rounded-lg border bg-[var(--color-surface)] text-[var(--color-on-surface)] text-body-md focus:outline-none focus:ring-2 focus:border-transparent ${parseFloat(depositCustom) > appointment.price ? "border-[var(--color-error)] focus:ring-[var(--color-error)]" : "border-[var(--color-outline-variant)] focus:ring-[var(--color-primary)]"}`}
                            />
                            {parseFloat(depositCustom) > appointment.price && (
                              <p className="text-[11px] text-[var(--color-error)] mt-1">
                                Máximo S/{appointment.price.toFixed(2)}
                              </p>
                            )}
                          </div>
                        )}

                        <button
                          onClick={handleSaveDeposit}
                          disabled={savingDeposit || (!depositCustom && depositMode === "amount") || (depositMode === "amount" && parseFloat(depositCustom) > appointment.price)}
                          className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-on-primary-fixed-variant)] text-[var(--color-on-primary)] text-label-md font-semibold py-2.5 rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          <DollarSign size={15} strokeWidth={1.5} />
                          {savingDeposit ? "Guardando..." : "Guardar Anticipo"}
                        </button>
                      </div>
                    ))}

                    {/* Reprogramar / Cancelar / No se presentó — solo si el servicio no terminó */}
                    {appointment.status !== "COMPLETED" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              if (!appointment) return;
                              handleUpdateStatus(
                                "RESCHEDULED",
                                "¿Marcar esta cita como reagendada y crear una nueva?",
                                () => router.push(`/nueva-cita?clientId=${appointment.client.id}`),
                              );
                            }}
                            disabled={updating}
                            className="w-full bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] text-label-md font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            <CalendarClock size={16} strokeWidth={1.5} />
                            Reprogramar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus("CANCELLED", "¿Cancelar esta cita? El cliente será notificado.")}
                            disabled={updating}
                            className="w-full bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-error)] border border-[var(--color-outline-variant)] text-label-md font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            <XCircle size={16} strokeWidth={1.5} />
                            {updating ? "..." : "Cancelar Cita"}
                          </button>
                        </div>

                        <button
                          onClick={() => handleUpdateStatus("NO_SHOW", "¿Marcar al cliente como no presentado?")}
                          disabled={updating}
                          className="w-full bg-transparent hover:bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] text-label-md font-semibold py-2 rounded-lg transition-colors border border-transparent hover:border-[var(--color-outline-variant)] flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <UserX size={15} strokeWidth={1.5} />
                          {updating ? "Actualizando..." : "Cliente no se presentó"}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Notificaciones WhatsApp */}
                {(waConfirmationUrl || waReminderUrl || waPaymentUrl) && (
                  <div className="pt-4 border-t border-[var(--color-outline-variant)]">
                    <h4 className="text-label-md font-semibold text-[var(--color-outline)] uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MessageSquare size={14} strokeWidth={1.5} />
                      Notificar por WhatsApp
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { url: waConfirmationUrl, label: "Confirmación", emoji: "✅" },
                        { url: waReminderUrl,     label: "Recordatorio", emoji: "🔔" },
                        { url: waPaymentUrl,      label: "Cobro",        emoji: "💳" },
                      ] as const).map(({ url, label, emoji }) =>
                        url ? (
                          <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100 transition-colors shadow-sm text-center"
                            title={`Enviar mensaje de ${label} por WhatsApp`}>
                            <MessageSquare size={15} strokeWidth={1.5} />
                            <span>{emoji} {label}</span>
                          </a>
                        ) : (
                          <span key={label}
                            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] text-[var(--color-outline)] text-[11px] font-semibold opacity-40 cursor-not-allowed text-center">
                            <MessageSquare size={15} strokeWidth={1.5} />
                            <span>{emoji} {label}</span>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[var(--color-outline-variant)]">
                  <h4 className="text-label-md font-semibold text-[var(--color-outline)] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <History size={14} strokeWidth={1.5} />
                    Historial de la Cita
                  </h4>
                  <div className="relative pl-4 space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--color-outline-variant)]/30">
                    {MOCK_TIMELINE.map((event) => (
                      <div key={event.label} className="relative">
                        <div className={`absolute -left-[17px] top-1 w-[10px] h-[10px] rounded-full ring-4 ring-[var(--color-surface-container-lowest)] ${event.active ? "bg-[var(--color-secondary)]" : "bg-[var(--color-outline-variant)]"}`} />
                        <p className="text-body-md text-[var(--color-on-surface)]">{event.label}</p>
                        <p className="text-label-md text-[var(--color-on-surface-variant)] mt-0.5">{event.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
