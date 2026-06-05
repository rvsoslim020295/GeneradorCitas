type StepProgressProps = {
  currentStep: number;
  totalSteps: number;
  label: string;
};

export function StepProgress({ currentStep, totalSteps, label }: StepProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-label-md text-[var(--color-on-surface-variant)] uppercase tracking-wider">
          Paso {currentStep} de {totalSteps}
        </span>
        <span className="text-label-md text-[var(--color-primary)]">{label}</span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < currentStep
                ? "bg-[var(--color-primary)]"
                : "bg-[var(--color-surface-variant)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
