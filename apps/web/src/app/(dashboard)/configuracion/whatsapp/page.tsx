"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Clock, FileText, Timer, CheckCircle } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const INITIAL_TEMPLATES = {
  reminder: `"Hola [Nombre del Cliente], te recordamos tu cita en GlowManager el [Fecha] a las [Hora]..."`,
  confirmation: `"¡Confirmado! Tu cita con [Nombre del Colaborador] para [Servicio] está agendada para [Fecha]..."`,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-variant)]"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export default function WhatsAppConfigPage() {
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder2h, setReminder2h] = useState(false);
  const [businessHoursOnly, setBusinessHoursOnly] = useState(true);
  const [reminderTemplate, setReminderTemplate] = useState(INITIAL_TEMPLATES.reminder);
  const [confirmationTemplate, setConfirmationTemplate] = useState(INITIAL_TEMPLATES.confirmation);
  const [editingReminder, setEditingReminder] = useState(false);
  const [editingConfirmation, setEditingConfirmation] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSaveAll() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <Sidebar activePath="/configuracion" />
      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
              <Link href="/configuracion" className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                <ArrowLeft size={20} strokeWidth={1.5} />
              </Link>
              <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Notificaciones WhatsApp</h1>
            </div>

            {saved && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-body-md">
                <CheckCircle size={16} strokeWidth={1.5} />
                Configuración guardada
              </div>
            )}

            {/* Connection Status */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <MessageCircle size={20} className="text-emerald-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Estado de Conexión</h2>
                    <div className="flex items-center gap-1.5 text-body-md text-emerald-600 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Conectado
                    </div>
                  </div>
                </div>
                <button className="text-label-md font-semibold text-[var(--color-error)] border border-[var(--color-error)]/30 px-3 py-1.5 rounded-lg hover:bg-[var(--color-error-container)]/20 transition-colors">
                  Desconectar
                </button>
              </div>
              <p className="text-body-md text-[var(--color-on-surface-variant)]">+1 (555) 019-8372</p>
            </section>

            {/* Automated Reminders */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                <div>
                  <h2 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Recordatorios Automáticos</h2>
                  <p className="text-body-md text-[var(--color-on-surface-variant)]">Envía mensajes a tiempo para reducir ausencias.</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "24 horas antes", detail: "Ideal para permitir cancelaciones a tiempo.", value: reminder24h, toggle: () => setReminder24h(!reminder24h) },
                  { label: "2 horas antes", detail: "Recordatorio final para la cita próxima.", value: reminder2h, toggle: () => setReminder2h(!reminder2h) },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-3 py-2 border-b border-[var(--color-outline-variant)]/40 last:border-0">
                    <div>
                      <p className="text-body-md font-semibold text-[var(--color-on-surface)]">{item.label}</p>
                      <p className="text-body-md text-[var(--color-on-surface-variant)] text-[12px]">{item.detail}</p>
                    </div>
                    <Toggle checked={item.value} onChange={item.toggle} />
                  </div>
                ))}
              </div>
            </section>

            {/* Message Templates */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                <div>
                  <h2 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Plantillas de Mensajes</h2>
                  <p className="text-body-md text-[var(--color-on-surface-variant)]">Personaliza lo que ven tus clientes.</p>
                </div>
              </div>

              {/* Appointment Reminder */}
              <div className="space-y-2">
                <h3 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Recordatorio de Cita</h3>
                {editingReminder ? (
                  <div className="space-y-2">
                    <textarea value={reminderTemplate} onChange={(e) => setReminderTemplate(e.target.value)} rows={3}
                      className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-primary)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none" />
                    <button onClick={() => setEditingReminder(false)}
                      className="text-label-md font-semibold text-[var(--color-primary)] flex items-center gap-1 hover:underline">
                      ✓ Guardar
                    </button>
                  </div>
                ) : (
                  <div className="bg-[var(--color-surface-container-low)] rounded-lg p-3 text-body-md text-[var(--color-on-surface-variant)] italic">
                    {reminderTemplate}
                    <button onClick={() => setEditingReminder(true)}
                      className="mt-2 flex items-center gap-1 text-[var(--color-primary)] text-label-md font-semibold not-italic hover:underline">
                      ✏ Editar
                    </button>
                  </div>
                )}
              </div>

              {/* Booking Confirmation */}
              <div className="space-y-2">
                <h3 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Confirmación de Cita</h3>
                {editingConfirmation ? (
                  <div className="space-y-2">
                    <textarea value={confirmationTemplate} onChange={(e) => setConfirmationTemplate(e.target.value)} rows={3}
                      className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-primary)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none" />
                    <button onClick={() => setEditingConfirmation(false)}
                      className="text-label-md font-semibold text-[var(--color-primary)] flex items-center gap-1 hover:underline">
                      ✓ Guardar
                    </button>
                  </div>
                ) : (
                  <div className="bg-[var(--color-surface-container-low)] rounded-lg p-3 text-body-md text-[var(--color-on-surface-variant)] italic">
                    {confirmationTemplate}
                    <button onClick={() => setEditingConfirmation(true)}
                      className="mt-2 flex items-center gap-1 text-[var(--color-primary)] text-label-md font-semibold not-italic hover:underline">
                      ✏ Editar
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Timing & Logic */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Timer size={20} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                <div>
                  <h2 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Horario de Envío</h2>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body-md font-semibold text-[var(--color-on-surface)]">Enviar solo en horario de negocio</p>
                  <p className="text-body-md text-[var(--color-on-surface-variant)] text-[12px]">Evita que los mensajes se envíen de madrugada.</p>
                </div>
                <Toggle checked={businessHoursOnly} onChange={() => setBusinessHoursOnly(!businessHoursOnly)} />
              </div>
            </section>

            <button onClick={handleSaveAll}
              className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-headline-sm font-semibold py-4 rounded-xl hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-md active:scale-[0.98] mb-4">
              Guardar Cambios
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
