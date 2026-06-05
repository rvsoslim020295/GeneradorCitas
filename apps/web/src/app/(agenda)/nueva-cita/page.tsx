import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { NewAppointmentModal } from "./_components/new-appointment-modal";

export default async function NuevaCitaPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  return (
    <>
      <Sidebar activePath="/agenda" />

      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-surface-bright)] relative overflow-hidden">
        <TopBar searchPlaceholder="Buscar citas, clientes..." />

        {/* Fondo difuminado simulando la agenda */}
        <div className="flex-1 pt-16 opacity-40 blur-sm pointer-events-none select-none overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)]">
            <h2 className="text-headline-md font-semibold text-[var(--color-on-surface)]">
              Octubre 24, Jueves
            </h2>
          </div>
          <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] m-6 rounded-lg flex h-64 shadow-sm">
            <div className="w-20 border-r border-[var(--color-outline-variant)] flex flex-col text-right pr-2 py-4 gap-8 text-label-md text-[var(--color-on-surface-variant)]">
              <div>09:00</div>
              <div>10:00</div>
              <div>11:00</div>
            </div>
            <div className="flex-1 grid grid-cols-3 divide-x divide-[var(--color-outline-variant)]">
              <div className="relative p-2">
                <div className="absolute top-10 left-2 right-2 bg-[var(--color-primary-container)]/20 border-l-4 border-[var(--color-primary)] rounded-r-md p-2 shadow-sm">
                  <p className="text-label-md text-[var(--color-primary)] text-[11px] mb-1">Corte Fade — 45m</p>
                  <p className="text-body-md text-[var(--color-on-surface)] text-[11px]">Juan Pérez</p>
                </div>
              </div>
              <div />
              <div />
            </div>
          </div>
        </div>

        {/* Overlay + Modal */}
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-inverse-surface)]/40 backdrop-blur-sm p-4">
          <NewAppointmentModal preselectedClientId={clientId} />
        </div>
      </main>
    </>
  );
}
