"use client";

import { MessageCircle, Phone, Share2, PersonStanding } from "lucide-react";

const origins = [
  { id: "whatsapp", icon: MessageCircle,  title: "WhatsApp / Mensaje" },
  { id: "phone",    icon: Phone,          title: "Teléfono" },
  { id: "social",   icon: Share2,         title: "Redes Sociales (Instagram, Facebook...)" },
  { id: "walkin",   icon: PersonStanding, title: "Presencial" },
] as const;

export type OriginId = (typeof origins)[number]["id"];

type Props = {
  value: OriginId;
  onChange: (id: OriginId) => void;
};

export function OriginSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-[var(--color-surface-container-low)] p-1 rounded-lg border border-[var(--color-outline-variant)]/50">
      {origins.map(({ id, icon: Icon, title }) => (
        <button
          key={id}
          type="button"
          title={title}
          onClick={() => onChange(id)}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center transition-all active:scale-95 ${
            value === id
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
