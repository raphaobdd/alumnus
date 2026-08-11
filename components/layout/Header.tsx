"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CheckSquare,
  CalendarCheck,
  Clock,
  LayoutDashboard,
  Sun,
  Moon,
  Sparkles,
  Calendar,
  type LucideIcon,
} from "lucide-react";

const ROUTE_CONFIG: Record<string, { title: string; icon: LucideIcon }> = {
  "/relatorio":  { title: "Inteligência Diária",       icon: Sparkles },
  "/calendario": { title: "Calendário de Datas",       icon: Calendar },
  "/notas":      { title: "Notas & Boletim",           icon: BarChart3 },
  "/tarefas":    { title: "Tarefas",                    icon: CheckSquare },
  "/presencas":  { title: "Presenças & Faltas",         icon: CalendarCheck },
  "/rotina":     { title: "Grade de Horários",          icon: Clock },
};

export function Header() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    const html = document.documentElement;
    const newDark = !html.classList.contains("dark");
    html.classList.toggle("dark", newDark);
    try { localStorage.setItem("theme", newDark ? "dark" : "light"); } catch {}
    setIsDark(newDark);
  };

  const currentRoute = Object.entries(ROUTE_CONFIG).find(([key]) =>
    pathname.startsWith(key)
  );
  const { title = "Dashboard", icon: Icon = LayoutDashboard } = currentRoute?.[1] ?? {};

  return (
    <>
      <style>{`
        .header {
          height: 58px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .header-title-icon-wrapper {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .theme-toggle {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background var(--transition), color var(--transition), transform var(--transition);
        }
        .theme-toggle:hover {
          background: var(--border);
          color: var(--text-primary);
          transform: scale(1.03);
        }
      `}</style>

      <header className="header">
        <div className="header-title">
          <div className="header-title-icon-wrapper">
            <Icon size={18} />
          </div>
          <span>{title}</span>
        </div>

        <div className="header-actions">
          <button
            id="theme-toggle"
            className="theme-toggle"
            onClick={toggleDark}
            title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
    </>
  );
}
