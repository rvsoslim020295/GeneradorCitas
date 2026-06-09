"use client";

import { useEffect, useState } from "react";

export type UserRole = "OWNER" | "ADMIN" | "COLLABORATOR" | null;

export type RoleInfo = {
  role: UserRole;
  collaboratorId: string | null;
};

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

export function useRoleInfo(): RoleInfo {
  const [info, setInfo] = useState<RoleInfo>({ role: null, collaboratorId: null });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gm_user");
      if (!raw) return;
      const user = JSON.parse(raw);
      setInfo({ role: user.role ?? null, collaboratorId: user.collaboratorId ?? null });
    } catch {
      // ignore
    }
  }, []);

  return info;
}
