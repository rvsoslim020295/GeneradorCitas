"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Phone, Mail, FileText, AlertCircle, CreditCard, ExternalLink } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function NuevoClientePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("+51 ");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  function handlePhoneChange(value: string) {
    // El prefijo "+51 " siempre debe estar presente
    if (!value.startsWith("+51 ")) {
      setPhone("+51 ");
      return;
    }
    // Solo permitir dígitos después del prefijo
    const suffix = value.slice(4).replace(/\D/g, "").slice(0, 9);
    setPhone("+51 " + suffix);
  }

  async function handleSave() {
    setError("");
    setDuplicateId(null);
    if (!firstName.trim()) { setError("El nombre es obligatorio."); return; }
    if (firstName.trim().length < 2) { setError("El nombre debe tener al menos 2 caracteres."); return; }
    const phoneSuffix = phone.slice(4).trim();
    if (!phoneSuffix || phoneSuffix.length < 9) {
      setError("El teléfono es obligatorio. Ingresa los 9 dígitos después de +51.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("El correo electrónico no tiene un formato válido.");
      return;
    }

    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: firstName.trim(),
          lastName: lastName.trim() || undefined,
          dni: dni.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Error al guardar el cliente.");
        if (d.duplicateId) setDuplicateId(d.duplicateId);
        return;
      }

      router.push("/clientes");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]";
  const labelClass = "block text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1";
  const iconInput = "pl-9";

  return (
    <>
      <Sidebar activePath="/clientes" />
      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-xl mx-auto px-6 py-6 space-y-6">
            {/* autoComplete="off" en el form evita sugerencias del browser */}
            <form autoComplete="off" onSubmit={e => { e.preventDefault(); handleSave(); }} className="contents">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/clientes" className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                  <ArrowLeft size={20} strokeWidth={1.5} />
                </Link>
                <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Nuevo Cliente</h1>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                <Save size={14} strokeWidth={2} />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-4 py-3 text-body-md text-[var(--color-error)]">
                <AlertCircle size={16} strokeWidth={1.5} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                  {duplicateId && (
                    <Link href={`/clientes/${duplicateId}`}
                      className="inline-flex items-center gap-1 mt-1 text-label-md font-semibold underline hover:opacity-80">
                      <ExternalLink size={12} strokeWidth={2} />
                      Ver perfil del cliente existente
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Datos personales */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Datos Personales</h2>

              {/* Nombre + Apellidos en fila */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nombres *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" strokeWidth={1.5} />
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="new-password" autoCorrect="off" spellCheck={false}
                      className={`${inputClass} ${iconInput}`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Apellidos</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" strokeWidth={1.5} />
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                      autoComplete="new-password" autoCorrect="off" spellCheck={false}
                      className={`${inputClass} ${iconInput}`} />
                  </div>
                </div>
              </div>

              {/* DNI */}
              <div>
                <label className={labelClass}>DNI</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" strokeWidth={1.5} />
                  <input value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    autoComplete="new-password" inputMode="numeric"
                    className={`${inputClass} ${iconInput}`} maxLength={8} />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className={labelClass}>Teléfono *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" strokeWidth={1.5} />
                  <input
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onFocus={(e) => {
                      // Posicionar cursor al final del prefijo si está vacío
                      if (e.target.value === "+51 ") {
                        setTimeout(() => e.target.setSelectionRange(4, 4), 0);
                      }
                    }}
                    autoComplete="new-password" inputMode="tel"
                    className={`${inputClass} ${iconInput}`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" strokeWidth={1.5} />
                  <input value={email} onChange={(e) => setEmail(e.target.value)}
                    autoComplete="new-password" autoCorrect="off" spellCheck={false}
                    className={`${inputClass} ${iconInput}`} />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className={labelClass}>Notas internas</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-3 text-[var(--color-outline)]" strokeWidth={1.5} />
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                    autoComplete="off" spellCheck={false}
                    className={`${inputClass} ${iconInput} resize-none`} placeholder="Preferencias, alergias, observaciones..." />
                </div>
              </div>
            </section>

            <button type="submit" disabled={saving}
              className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-headline-sm font-semibold py-4 rounded-xl hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-md disabled:opacity-60 active:scale-[0.98] mb-4">
              {saving ? "Guardando..." : "Guardar Cliente"}
            </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
