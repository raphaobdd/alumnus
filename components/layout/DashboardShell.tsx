"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
}

export function DashboardShell({
  children,
  userEmail,
  userName,
}: DashboardShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <style>{`
        .dashboard-layout {
          display: flex;
          min-height: 100dvh;
          background: var(--background);
        }
        .dashboard-main {
          flex: 1;
          margin-left: var(--sidebar-width);
          min-width: 0;
          display: flex;
          flex-direction: column;
          transition: margin-left var(--transition-slow);
        }
        .dashboard-content {
          flex: 1;
          padding: 24px;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0;
          }
          .dashboard-content {
            padding: 16px;
          }
        }
      `}</style>

      <Sidebar
        userEmail={userEmail}
        userName={userName}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      <main className="dashboard-main">
        <Header onMenuToggle={() => setIsMobileOpen((prev) => !prev)} />
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
