"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, Flower2 } from "lucide-react";

export function StepListo() {
  const router = useRouter();

  return (
    <div className="glass-panel p-8 rounded-2xl text-center space-y-6">
      <div className="flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle size={40} className="text-emerald-600" strokeWidth={1.5} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-headline-md font-bold text-[var(--color-on-surface)]">
          ¡Todo listo!
        </h2>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">
          Tu cuenta está configurada. Ahora puedes gestionar tu agenda, servicios y clientes desde un solo lugar.
        </p>
      </div>

      <div className="flex flex-col gap-3 items-center">
        <div className="flex flex-wrap justify-center gap-2 text-body-md text-[var(--color-on-surface-variant)]">
          {["Agenda lista", "Perfil configurado", "Prueba gratuita activa"].map((item) => (
            <span key={item} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-label-md font-semibold">
              <CheckCircle size={12} strokeWidth={2} />
              {item}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-3 px-4 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm">
        Ir al Dashboard
        <ArrowRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
