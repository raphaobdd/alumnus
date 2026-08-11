import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/supabase/auth-cache";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const userName = user.user_metadata?.full_name as string | undefined;

  return (
    <div className="dashboard-layout">
      <style>{`
        .dashboard-layout {
          display: flex;
          min-height: 100dvh;
        }
        .dashboard-main {
          flex: 1;
          margin-left: var(--sidebar-width);
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .dashboard-content {
          flex: 1;
          padding: 24px;
          max-width: 1200px;
          width: 100%;
        }
        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0;
          }
        }
      `}</style>

      <Sidebar userEmail={user.email} userName={userName} />

      <main className="dashboard-main">
        <Header />
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
