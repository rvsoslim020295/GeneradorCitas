"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, HelpCircle, LogOut, Settings, X, Sun, Moon, CalendarClock, CalendarCheck, CalendarX } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { GlobalSearch } from "@/components/layout/global-search";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type NotifType = "pending_confirmation" | "starting_soon" | "unclosed";
type NotifItem = { id: string; type: NotifType; title: string; body: string; appointmentId: string };

const NOTIF_ICON: Record<NotifType, React.ReactNode> = {
  pending_confirmation: <CalendarClock size={15} className="text-amber-500 shrink-0 mt-0.5" />,
  starting_soon:        <CalendarCheck  size={15} className="text-[var(--color-primary)] shrink-0 mt-0.5" />,
  unclosed:             <CalendarX      size={15} className="text-[var(--color-error)] shrink-0 mt-0.5" />,
};

type TopBarProps = {
  searchPlaceholder?: string;
};

export function TopBar({ searchPlaceholder = "Buscar cliente, servicio o cita..." }: TopBarProps) {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState("Usuario");
  const [userInitials, setUserInitials] = useState("AM");

  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [notifsLoaded, setNotifsLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("gm_user");
    if (raw) {
      try {
        const user = JSON.parse(raw);
        if (user.name) {
          setUserName(user.name);
          const parts = user.name.trim().split(" ");
          const initials = parts.length >= 2
            ? parts[0][0] + parts[1][0]
            : parts[0].slice(0, 2);
          setUserInitials(initials.toUpperCase());
        }
      } catch { /* ignore */ }
    }
  }, []);

  const fetchNotifs = useCallback(async () => {
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setNotifs(Array.isArray(data.items) ? data.items : []);
      }
    } catch { /* ignore */ }
    finally { setNotifsLoaded(true); }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setShowHelp(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem("gm_token");
    localStorage.removeItem("gm_user");
    router.push("/login");
  }

  function handleOpenNotifs() {
    setShowNotifications(!showNotifications);
    setShowProfile(false);
    setShowHelp(false);
    if (!showNotifications) fetchNotifs();
  }

  return (
    <header className="bg-[var(--color-surface)]/80 backdrop-blur-md fixed top-0 right-0 w-[calc(100%-16rem)] h-16 border-b border-[var(--color-outline-variant)] flex justify-between items-center px-6 z-30">
      {/* Búsqueda global */}
      <GlobalSearch placeholder={searchPlaceholder} />

      {/* Acciones */}
      <div className="flex items-center gap-3">

        {/* Campana de notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotifs}
            className="w-10 h-10 rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-all flex items-center justify-center relative">
            <Bell size={20} strokeWidth={1.5} />
            {notifsLoaded && notifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-error)]" />
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 w-88 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-xl z-50 overflow-hidden" style={{ width: 340 }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-outline-variant)]">
                <div className="flex items-center gap-2">
                  <h3 className="text-label-md font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">Notificaciones</h3>
                  {notifs.length > 0 && (
                    <span className="bg-[var(--color-error)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{notifs.length}</span>
                  )}
                </div>
                <button onClick={() => setShowNotifications(false)} className="text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
              {notifs.length === 0 ? (
                <div className="px-4 py-8 text-center text-body-md text-[var(--color-on-surface-variant)]">
                  No tienes notificaciones nuevas
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                  {notifs.map(n => (
                    <button
                      key={n.id}
                      onClick={() => { router.push(`/citas/${n.appointmentId}`); setShowNotifications(false); }}
                      className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-[var(--color-surface-container-low)] transition-colors border-b border-[var(--color-outline-variant)]/40 last:border-0"
                    >
                      {NOTIF_ICON[n.type]}
                      <div className="min-w-0">
                        <p className="text-label-md font-semibold text-[var(--color-on-surface)]">{n.title}</p>
                        <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">{n.body}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ayuda */}
        <div className="relative" ref={helpRef}>
          <button
            onClick={() => { setShowHelp(!showHelp); setShowProfile(false); setShowNotifications(false); }}
            className="w-10 h-10 rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-all flex items-center justify-center">
            <HelpCircle size={20} strokeWidth={1.5} />
          </button>
          {showHelp && (
            <div className="absolute right-0 top-12 w-60 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-xl z-50 overflow-hidden py-2">
              <p className="px-4 py-2 text-body-md text-[var(--color-on-surface-variant)]">¿Necesitas ayuda?</p>
              <a href="mailto:soporte@glowmanager.app"
                className="flex items-center gap-3 px-4 py-2.5 text-body-md text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] transition-colors">
                Contactar soporte
              </a>
            </div>
          )}
        </div>

        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="w-10 h-10 rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-all flex items-center justify-center"
        >
          {theme === "dark"
            ? <Sun size={20} strokeWidth={1.5} />
            : <Moon size={20} strokeWidth={1.5} />
          }
        </button>

        {/* Perfil */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowHelp(false); }}
            className="w-9 h-9 rounded-full bg-[var(--color-primary-container)] border-2 border-[var(--color-surface-container-highest)] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
            <span className="text-label-md font-bold text-[var(--color-primary)]">{userInitials}</span>
          </button>
          {showProfile && (
            <div className="absolute right-0 top-12 w-56 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--color-outline-variant)]">
                <p className="text-body-md font-semibold text-[var(--color-on-surface)] truncate">{userName}</p>
              </div>
              <div className="py-1">
                <button onClick={() => { router.push("/configuracion/negocio"); setShowProfile(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-body-md text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] transition-colors">
                  <Settings size={16} strokeWidth={1.5} className="text-[var(--color-outline)]" />
                  Configuración
                </button>
                <div className="border-t border-[var(--color-outline-variant)] mt-1 pt-1">
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-body-md text-[var(--color-error)] hover:bg-[var(--color-error-container)]/20 transition-colors">
                    <LogOut size={16} strokeWidth={1.5} />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
