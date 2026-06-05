"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AgendaToolbar, ViewOption } from "./_components/agenda-toolbar";
import { CalendarGrid } from "./_components/calendar-grid";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type AppointmentData = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  client: { id: string; name: string; phone: string | null };
  collaborator: { id: string; name: string; role: string };
  service: { id: string; name: string; durationMin: number; category: string };
};

export type CollaboratorData = { id: string; name: string; role: string };

export default function AgendaPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewOption>("Día");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filteredCollabId, setFilteredCollabId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/appointments`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/collaborators`, { headers: h }).then(r => r.ok ? r.json() : []),
    ])
      .then(([apts, cols]) => {
        setAppointments(Array.isArray(apts) ? apts : []);
        // Solo colaboradores activos
        const active: CollaboratorData[] = (Array.isArray(cols) ? cols : [])
          .filter((c: CollaboratorData & { isActive?: boolean }) => c.isActive !== false);
        setCollaborators(active);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const visibleAppointments = filteredCollabId
    ? appointments.filter(a => a.collaborator.id === filteredCollabId)
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
              appointments={visibleAppointments}
              allAppointments={appointments}
              view={activeView}
              currentDate={currentDate}
            />
          )}
        </div>
      </main>
    </>
  );
}
