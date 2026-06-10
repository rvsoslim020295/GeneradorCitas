"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { SidebarProvider } from "@/hooks/use-sidebar";

const PLAN_EXEMPT_PATHS = ["/plan-vencido", "/planes"];

type AuthMe = {
  business: { planStatus: string };
  role: string;
};

export default function AgendaLayout({
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
