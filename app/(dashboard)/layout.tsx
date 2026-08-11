import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/supabase/auth-cache";
import { DashboardShell } from "@/components/layout/DashboardShell";

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
    <DashboardShell userEmail={user.email} userName={userName}>
      {children}
    </DashboardShell>
  );
}
