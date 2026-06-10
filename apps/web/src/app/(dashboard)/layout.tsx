"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { SidebarProvider } from "@/hooks/use-sidebar";

const PLAN_EXEMPT_PATHS = ["/plan-vencido", "/planes"];

// Rutas que solo el OWNER puede ver
const OWNER_ONLY_PATHS = ["/paquetes", "/reportes", "/configuracion"];

// Rutas que COLLABORATOR puede ver (además de /agenda y /citas/*)
const COLLABORATOR_ALLOWED_PATHS = ["/agenda", "/citas", "/nueva-cita", "/plan-vencido", "/planes"];

type AuthMe = {
  business: { planStatus: string };
  role: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (PLAN_EXEMPT_PATHS.some((p) => pathname.startsWith(p))) return;

    apiFetch<AuthMe>("/auth/me")
      .then((me) => {
        const { planStatus } = me.business;
        if (planStatus === "EXPIRED" || planStatus === "SUSPENDED") {
          router.replace("/plan-vencido");
          return;
        }

        const role = me.role;

        // COLLABORATOR: solo puede ver agenda, citas, nueva-cita
        if (role === "COLLABORATOR") {
          const allowed = COLLABORATOR_ALLOWED_PATHS.some((p) => pathname.startsWith(p));
          if (!allowed) {
            router.replace("/agenda");
          }
          return;
        }

        // ADMIN: no puede ver rutas owner-only
        if (role === "ADMIN") {
          const restricted = OWNER_ONLY_PATHS.some((p) => pathname.startsWith(p));
          if (restricted) {
            router.replace("/dashboard");
          }
          return;
        }
      })
      .catch(() => {});
  }, [pathname, router]);

  return (
    <SidebarProvider>
      <div className="bg-[var(--color-background)] text-[var(--color-on-background)] h-screen w-screen overflow-hidden flex antialiased">
        {children}
      </div>
    </SidebarProvider>
  );
}
