"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AgendaToolbar, ViewOption } from "./_components/agenda-toolbar";
import { CalendarGrid } from "./_components/calendar-grid";
import { useAppointments, useCollaborators } from "@/lib/api/hooks";

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

export default function AgendaPage() {
  const [activeView, setActiveView] = useState<ViewOption>("Día");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filteredCollabId, setFilteredCollabId] = useState<string | null>(null);

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
          <AgendaToolbar
            activeView={activeView}
            currentDate={currentDate}
            onViewChange={setActiveView}
            onDateChange={setCurrentDate}
            collaborators={collaborators}
            filteredCollabId={filteredCollabId}
            onFilterCollab={setFilteredCollabId}
          />
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CalendarGrid
              appointments={visibleAppointments as unknown as AppointmentData[]}
              allAppointments={appointments as unknown as AppointmentData[]}
              view={activeView}
              currentDate={currentDate}
            />
          )}
        </div>
      </main>
    </>
  );
}
