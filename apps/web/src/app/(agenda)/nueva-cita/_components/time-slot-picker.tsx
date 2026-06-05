"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

const slots = ["10:00", "10:45", "11:30"];

export function TimeSlotPicker() {
  const [selected, setSelected] = useState("10:00");

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => setSelected(slot)}
          className={`px-3 py-1.5 rounded-md border text-label-md font-semibold transition-colors shadow-sm ${
            selected === slot
              ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/10 text-[var(--color-primary)]"
              : "border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          }`}
        >
          {slot}
        </button>
      ))}
      <button
        type="button"
        className="px-2 py-1.5 rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors shadow-sm flex items-center"
      >
        <MoreHorizontal size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}
