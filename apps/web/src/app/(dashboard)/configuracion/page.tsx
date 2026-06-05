import Link from "next/link";
import { Building2, CalendarClock, MessageCircle, ChevronRight } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const sections = [
  {
    href: "/configuracion/negocio",
    icon: Building2,
    title: "Datos del Negocio",
    description: "Nombre, categoría, teléfono, dirección y zona horaria",
  },
  {
    href: "/configuracion/agenda",
    icon: CalendarClock,
    title: "Agenda y Políticas",
    description: "Duración de slots, política de cancelación y días de operación",
  },
  {
    href: "/configuracion/whatsapp",
    icon: MessageCircle,
    title: "Notificaciones WhatsApp",
    description: "Recordatorios automáticos y plantillas de mensajes",
  },
];

export default function ConfiguracionPage() {
  return (
    <>
      <Sidebar activePath="/configuracion" />

      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
            <div className="mb-6">
              <h1 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Configuración</h1>
              <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
                Personaliza GlowManager para tu negocio
              </p>
            </div>

            {sections.map(({ href, icon: Icon, title, description }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-container)]/20 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary-container)]/30 transition-colors">
                  <Icon size={22} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-body-lg font-semibold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                    {title}
                  </h2>
                  <p className="text-body-md text-[var(--color-on-surface-variant)] mt-0.5">
                    {description}
                  </p>
                </div>
                <ChevronRight size={20} className="text-[var(--color-outline)] shrink-0" strokeWidth={1.5} />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
