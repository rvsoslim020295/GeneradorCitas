"use client";

import { useEffect, useState } from "react";

export type UserRole = "OWNER" | "ADMIN" | "COLLABORATOR" | null;

export function useRole(): UserRole {
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gm_user");
      if (!raw) return;
      const user = JSON.parse(raw);
      setRole(user.role ?? null);
    } catch {
      // ignore
    }
  }, []);

  return role;
}
