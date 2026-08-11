"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { useTransition } from "react";
import {
  GraduationCap,
  BarChart3,
  CheckSquare,
  CalendarCheck,
  Clock,
  LogOut,
  Loader2,
  Sparkles,
  Calendar,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/relatorio",  icon: Sparkles,      label: "Inteligência", id: "nav-relatorio" },
  { href: "/calendario", icon: Calendar,      label: "Calendário",   id: "nav-calendario" },
  { href: "/notas",      icon: BarChart3,     label: "Notas",        id: "nav-notas" },
  { href: "/tarefas",    icon: CheckSquare,   label: "Tarefas",      id: "nav-tarefas" },
  { href: "/presencas",  icon: CalendarCheck, label: "Presenças",    id: "nav-presencas" },
  { href: "/rotina",     icon: Clock,         label: "Rotina",       id: "nav-rotina" },
];

interface SidebarProps {
  userEmail?: string;
  userName?: string;
}

export function Sidebar({ userEmail, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <>
      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100dvh;
          position: fixed;
          left: 0;
          top: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: transform var(--transition-slow);
        }
        .sidebar-logo {
          padding: 20px 20px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--border);
        }
        .sidebar-logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .sidebar-logo-text {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .sidebar-nav {
          flex: 1;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: background var(--transition), color var(--transition);
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }
        .nav-item:hover {
          background: var(--surface-2);
          color: var(--text-primary);
        }
        .nav-item.active {
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 600;
        }
        .nav-item.active .nav-icon {
          color: var(--primary);
        }
        .nav-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          color: var(--text-muted);
          transition: color var(--transition);
        }
        .nav-item:hover .nav-icon {
          color: var(--text-primary);
        }
        .sidebar-footer {
          padding: 12px 10px;
          border-top: 1px solid var(--border);
        }
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          margin-bottom: 4px;
          background: var(--surface-2);
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .user-info {
          flex: 1;
          min-width: 0;
        }
        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .user-email {
          font-size: 11px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .logout-btn {
          color: var(--danger) !important;
          margin-top: 4px;
        }
        .logout-btn:hover {
          background: var(--danger-light) !important;
          color: var(--danger) !important;
        }
        .logout-btn .nav-icon {
          color: var(--danger);
        }
      `}</style>

      <aside className="sidebar" aria-label="Navegação principal">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <GraduationCap size={20} />
          </div>
          <span className="sidebar-logo-text">Alumnus</span>
        </div>

        {/* Navegação */}
        <nav className="sidebar-nav" aria-label="Menu principal">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                id={item.id}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="nav-icon" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Usuário */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar" aria-hidden="true">
              {(userName || userEmail || "U")[0].toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{userName || "Usuário"}</div>
              <div className="user-email">{userEmail}</div>
            </div>
          </div>

          <button
            id="sidebar-logout"
            className="nav-item logout-btn"
            onClick={handleLogout}
            disabled={isPending}
            aria-label="Sair da conta"
          >
            {isPending ? (
              <Loader2 className="nav-icon animate-spin" />
            ) : (
              <LogOut className="nav-icon" />
            )}
            {isPending ? "Saindo..." : "Sair"}
          </button>
        </div>
      </aside>
    </>
  );
}
