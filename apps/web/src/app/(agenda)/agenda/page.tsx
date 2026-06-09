"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AgendaToolbar, ViewOption } from "./_components/agenda-toolbar";
import { CalendarGrid } from "./_components/calendar-grid";
import { useAppointments, useCollaborators } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

export type AppointmentData = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  client: { id: string; name: string; phone: string | null };
  collaborator: { id: string; name: string; role: string };
  service: { id: string; name: string; durationMin: number; bufferMinutes: number; category: string };
};

export type CollaboratorData = { id: string; name: string; role: string };

type AuthMe = { role: string; name: string };

export default function AgendaPage() {
  const [activeView, setActiveView] = useState<ViewOption>("Día");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filteredCollabId, setFilteredCollabId] = useState<string | null>(null);

  const { data: me } = useQuery<AuthMe>({
    queryKey: ["auth-me-role"],
    queryFn: () => apiFetch<AuthMe>("/auth/me"),
    staleTime: 60_000,
  });

  const isCollaborator = me?.role === "COLLABORATOR";

  const { data: appointments = [], isLoading: loadingApts } = useAppointments();
  const { data: allCollabs = [], isLoading: loadingCollabs } = useCollaborators();

  const collaborators = allCollabs.filter((c) => c.isActive !== false) as CollaboratorData[];
  const loading = loadingApts || loadingCollabs;

  const visibleAppointments = filteredCollabId
    ? appointments.filter((a) => a.collaborator.id === filteredCollabId)
    : appointments;

  return (
    <>
      <Sidebar activePath="/agenda" />

      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-surface-bright)] relative overflow-hidden">
        <TopBar searchPlaceholder="Buscar citas, clientes..." />

        <div className="flex flex-col flex-1 overflow-hidden pt-16">
          {/* Banner informativo para colaboradores */}
          {isCollaborator && (
            <div className="mx-4 mt-3 mb-0 flex items-center gap-2.5 bg-[var(--color-primary-container)]/20 border border-[var(--color-primary)]/20 rounded-xl px-4 py-3 text-body-md text-[var(--color-primary)]">
              <CalendarDays size={16} strokeWidth={1.5} className="shrink-0" />
              <span>
                Estás viendo la agenda del día como <span className="font-semibold">Colaborador</span>.
                Usa el filtro de colaborador para ver solo tus citas.
              </span>
            </div>
          )}

          <AgendaToolbar
            activeView={activeView}
            currentDate={currentDate}
            onViewChange={isCollaborator ? undefined : setActiveView}
            onDateChange={setCurrentDate}
            collaborators={collaborators}
            filteredCollabId={filteredCollabId}
            onFilterCollab={setFilteredCollabId}
            lockedToDayView={isCollaborator}
          />
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CalendarGrid
              appointments={visibleAppointments as unknown as AppointmentData[]}
              allAppointments={appointments as unknown as AppointmentData[]}
              view={isCollaborator ? "Día" : activeView}
              currentDate={currentDate}
            />
          )}
        </div>
      </main>
    </>
  );
}
