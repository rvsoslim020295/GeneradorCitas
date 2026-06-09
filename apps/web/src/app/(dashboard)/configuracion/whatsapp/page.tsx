"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, FileText, CheckCircle, Copy, Info } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useSettings, useUpdateSettings } from "@/lib/api/hooks";

const DEFAULT_TEMPLATES = {
  confirmation: `Hola {cliente}, ✅ tu cita está confirmada en {negocio}.

📅 {fecha} a las {hora}
✂️ {servicio} con {colaborador}
💰 S/{precio}

¡Te esperamos!`,
  reminder: `Hola {cliente}, 🔔 te recordamos tu cita de mañana en {negocio}.

📅 {fecha} a las {hora}
✂️ {servicio} con {colaborador}

Si necesitas reagendar escríbenos. ¡Hasta mañana!`,
  payment: `Hola {cliente}, 💳 tu servicio de {servicio} quedó pendiente de pago.

💰 Total: S/{precio}
📍 {negocio}

Por favor acércate a cancelar cuando puedas. ¡Gracias!`,
};

const VARIABLES = [
  { key: "{cliente}",      desc: "Nombre del cliente" },
  { key: "{negocio}",      desc: "Nombre del negocio" },
  { key: "{fecha}",        desc: "Fecha de la cita" },
  { key: "{hora}",         desc: "Hora de la cita" },
  { key: "{servicio}",     desc: "Nombre del servicio" },
  { key: "{colaborador}",  desc: "Nombre del colaborador" },
  { key: "{precio}",       desc: "Precio del servicio" },
];

function TemplateEditor({
  label, description, value, onChange,
}: { label: string; description: string; value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">{label}</h3>
          <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5">{description}</p>
        </div>
        <button onClick={() => setEditing(v => !v)}
          className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline px-2 py-1">
          {editing ? "✓ Listo" : "✏ Editar"}
        </button>
      </div>

      {editing ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={5}
          className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-primary)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none font-mono text-[13px]"
        />
      ) : (
        <div className="bg-[var(--color-surface-container-low)] rounded-lg p-3 text-[13px] text-[var(--color-on-surface-variant)] whitespace-pre-wrap font-mono border border-[var(--color-outline-variant)]/40">
          {value}
        </div>
      )}
    </div>
  );
}

export default function WhatsAppConfigPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [confirmation, setConfirmation] = useState(DEFAULT_TEMPLATES.confirmation);
  const [reminder, setReminder]         = useState(DEFAULT_TEMPLATES.reminder);
  const [payment, setPayment]           = useState(DEFAULT_TEMPLATES.payment);
  const [reminderEnabled, setReminderEnabled]     = useState(false);
  const [reminder2hEnabled, setReminder2hEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!settings) return;
    if (settings.waTplConfirmation) setConfirmation(settings.waTplConfirmation);
    if (settings.waTplReminder)     setReminder(settings.waTplReminder);
    if (settings.waTplPayment)      setPayment(settings.waTplPayment);
    setReminderEnabled(settings.reminderEnabled   ?? false);
    setReminder2hEnabled(settings.reminder2hEnabled ?? false);
  }, [settings]);

  async function handleSave() {
    await updateSettings.mutateAsync({
      waTplConfirmation: confirmation,
      waTplReminder: reminder,
      waTplPayment: payment,
      reminderEnabled,
      reminder2hEnabled,
    } as never);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function copyVar(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <>
      <Sidebar activePath="/configuracion" />
      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

            <div className="flex items-center gap-3">
              <Link href="/configuracion" className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                <ArrowLeft size={20} strokeWidth={1.5} />
              </Link>
              <div>
                <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Notificaciones WhatsApp</h1>
                <p className="text-[12px] text-[var(--color-on-surface-variant)]">Mensajes manuales via wa.me — sin costo, sin API externa</p>
              </div>
            </div>

            {saved && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-body-md">
                <CheckCircle size={16} strokeWidth={1.5} />
                Plantillas guardadas correctamente
              </div>
            )}

            {/* Cómo funciona */}
            <section className="bg-[var(--color-primary-container)]/10 border border-[var(--color-primary)]/20 rounded-xl p-4 flex gap-3">
              <Info size={18} className="text-[var(--color-primary)] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="space-y-1">
                <p className="text-body-md font-semibold text-[var(--color-on-surface)]">¿Cómo funciona?</p>
                <p className="text-[12px] text-[var(--color-on-surface-variant)] leading-relaxed">
                  En cada cita encontrarás botones de WhatsApp para <strong>Confirmación</strong>, <strong>Recordatorio</strong> y <strong>Cobro pendiente</strong>.
                  Al hacer clic se abre WhatsApp Web con el mensaje pre-llenado y los datos reales del cliente.
                  Tú solo presionas Enviar — sin APIs ni costos.
                </p>
              </div>
            </section>

            {/* Recordatorios automáticos */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                <h2 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Recordatorios automáticos</h2>
              </div>
              <p className="text-body-md text-[var(--color-on-surface-variant)]">
                El sistema genera un link de WhatsApp con el mensaje de recordatorio listo para enviar. El link queda registrado en el historial de la cita.
              </p>
              <div className="space-y-3">
                {[
                  { label: "Recordatorio 24h antes", desc: "Se genera el link un día antes de la cita", value: reminderEnabled, set: setReminderEnabled },
                  { label: "Recordatorio 2h antes",  desc: "Se genera el link 2 horas antes de la cita", value: reminder2hEnabled, set: setReminder2hEnabled },
                ].map(({ label, desc, value, set }) => (
                  <div key={label} className="flex justify-between gap-4 p-3 bg-[var(--color-surface-container-low)] rounded-lg">
                    <div className="flex flex-col justify-center">
                      <p className="text-body-md font-semibold text-[var(--color-on-surface)]">{label}</p>
                      <p className="text-[12px] text-[var(--color-on-surface-variant)]">{desc}</p>
                    </div>
                    <button
                      onClick={() => set(v => !v)}
                      className={`relative shrink-0 self-center w-11 h-6 rounded-full transition-colors ${value ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-container-high)]"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Variables disponibles */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                <h2 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Variables disponibles</h2>
              </div>
              <p className="text-[12px] text-[var(--color-on-surface-variant)]">Clic en una variable para copiarla al portapapeles.</p>
              <div className="flex flex-wrap gap-2">
                {VARIABLES.map(v => (
                  <button key={v.key} onClick={() => copyVar(v.key)} title={v.desc}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[12px] font-mono font-semibold transition-colors ${
                      copied === v.key
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : "bg-[var(--color-surface-container-low)] border-[var(--color-outline-variant)] text-[var(--color-primary)] hover:bg-[var(--color-primary-container)]/20"
                    }`}>
                    {copied === v.key ? <CheckCircle size={11} /> : <Copy size={11} />}
                    {v.key}
                    <span className="text-[10px] font-normal text-[var(--color-on-surface-variant)] font-sans">{v.desc}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Plantillas */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-6">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                <h2 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Plantillas de mensajes</h2>
              </div>

              {isLoading ? (
                <p className="text-body-md text-[var(--color-on-surface-variant)]">Cargando...</p>
              ) : (
                <>
                  <TemplateEditor
                    label="✅ Confirmación de cita"
                    description="Se envía al agendar o confirmar una cita."
                    value={confirmation}
                    onChange={setConfirmation}
                  />
                  <div className="border-t border-[var(--color-outline-variant)]/40" />
                  <TemplateEditor
                    label="🔔 Recordatorio"
                    description="Para recordar la cita del día siguiente."
                    value={reminder}
                    onChange={setReminder}
                  />
                  <div className="border-t border-[var(--color-outline-variant)]/40" />
                  <TemplateEditor
                    label="💳 Cobro pendiente"
                    description="Cuando el servicio se completó pero no se cobró."
                    value={payment}
                    onChange={setPayment}
                  />
                </>
              )}
            </section>

            <button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-headline-sm font-semibold py-4 rounded-xl hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-md active:scale-[0.98] mb-4 disabled:opacity-60"
            >
              {updateSettings.isPending ? "Guardando..." : "Guardar Plantillas"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
