import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/supabase/auth-cache";
import { ProfileClient } from "@/components/auth/ProfileClient";

export const metadata: Metadata = {
  title: "Perfil & Configurações",
};

export default async function PerfilPage() {
  const { user } = await getAuthenticatedUser();
  const userName = (user?.user_metadata?.full_name as string) || "";
  const userEmail = user?.email || "";

  return <ProfileClient userEmail={userEmail} initialFullName={userName} />;
}
