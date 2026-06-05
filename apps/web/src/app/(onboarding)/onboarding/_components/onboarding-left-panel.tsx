export function OnboardingLeftPanel() {
  return (
    <div className="hidden md:flex flex-col justify-center h-full rounded-2xl overflow-hidden relative min-h-[600px] bg-[var(--color-primary)]">
      {/* Gradient overlay simulating the salon photo ambiance */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-container)] to-[var(--color-on-primary-fixed-variant)]" />

      <div className="relative z-10 p-8 flex flex-col h-full justify-between">
        <div className="text-display-lg font-bold text-[var(--color-on-primary)]">
          GlowManager
        </div>

        <div className="space-y-4">
          <p className="text-headline-md font-semibold text-[var(--color-on-primary)]">
            Hagamos brillar tu negocio
          </p>
          <p className="text-body-lg text-[var(--color-on-primary)]/90 max-w-md">
            Configura tu espacio de trabajo en minutos y toma el control total
            de tu agenda, servicios y clientes con precisión suiza.
          </p>
        </div>
      </div>
    </div>
  );
}
