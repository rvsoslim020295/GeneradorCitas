"use client";

import { useState } from "react";
import { OnboardingLeftPanel } from "./_components/onboarding-left-panel";
import { SalonProfileForm } from "./_components/salon-profile-form";
import { StepHorario } from "./_components/step-horario";
import { StepPrimerServicio } from "./_components/step-primer-servicio";
import { StepListo } from "./_components/step-listo";
import { StepProgress } from "./_components/step-progress";

const STEPS = [
  { label: "Perfil del Salón" },
  { label: "Horario" },
  { label: "Primer Servicio" },
  { label: "¡Listo!" },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);

  function nextStep() {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  }

  const stepInfo = STEPS[currentStep - 1];

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Panel izquierdo: branding (solo desktop) */}
        <OnboardingLeftPanel />

        {/* Panel derecho: formulario */}
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Logo mobile */}
          <div className="md:hidden text-center">
            <span className="text-display-lg font-bold text-[var(--color-primary)]">
              GlowManager
            </span>
          </div>

          {/* Progreso */}
          <StepProgress currentStep={currentStep} totalSteps={STEPS.length} label={stepInfo.label} />

          {/* Encabezado */}
          <div className="space-y-1">
            {currentStep === 1 && (
              <>
                <h1 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Comencemos con lo básico</h1>
                <p className="text-body-md text-[var(--color-on-surface-variant)]">Necesitamos algunos detalles para personalizar tu experiencia.</p>
              </>
            )}
            {currentStep === 2 && (
              <>
                <h1 className="text-headline-md font-semibold text-[var(--color-on-surface)]">¿Cuándo atiendes?</h1>
                <p className="text-body-md text-[var(--color-on-surface-variant)]">Configura los días en que atiendes a tus clientes.</p>
              </>
            )}
            {currentStep === 3 && (
              <>
                <h1 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Tu primer servicio</h1>
                <p className="text-body-md text-[var(--color-on-surface-variant)]">Agrega un servicio a tu catálogo para empezar a recibir citas.</p>
              </>
            )}
            {currentStep === 4 && (
              <>
                <h1 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Configuración completa</h1>
                <p className="text-body-md text-[var(--color-on-surface-variant)]">Tu negocio ya está listo en GlowManager.</p>
              </>
            )}
          </div>

          {/* Formulario por paso */}
          {currentStep === 1 && <SalonProfileForm onNext={nextStep} />}
          {currentStep === 2 && <StepHorario onNext={nextStep} />}
          {currentStep === 3 && <StepPrimerServicio onNext={nextStep} />}
          {currentStep === 4 && <StepListo />}
        </div>
      </div>
    </main>
  );
}
