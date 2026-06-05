"use client";

import { useState } from "react";
import { MessageCircle, Phone, Camera, PersonStanding } from "lucide-react";

const origins = [
  { id: "whatsapp", icon: MessageCircle, title: "WhatsApp / Mensaje" },
  { id: "phone", icon: Phone, title: "Teléfono" },
  { id: "instagram", icon: Camera, title: "Instagram / Redes" },
  { id: "walkin", icon: PersonStanding, title: "Presencial" },
] as const;

type OriginId = (typeof origins)[number]["id"];

export function OriginSelector() {
  const [selected, setSelected] = useState<OriginId>("whatsapp");

  return (
    <div className="flex gap-1 bg-[var(--color-surface-container-low)] p-1 rounded-lg border border-[var(--color-outline-variant)]/50">
      {origins.map(({ id, icon: Icon, title }) => (
        <button
          key={id}
          type="button"
          title={title}
          onClick={() => setSelected(id)}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center transition-all active:scale-95 ${
            selected === id
              ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm"
              : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
          }`}
        >
          <Icon size={18} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}
