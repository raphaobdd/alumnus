import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Página raiz: redireciona para /notas se autenticado, /login se não
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/notas");
  } else {
    redirect("/login");
  }
}
