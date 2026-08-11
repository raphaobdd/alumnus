import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Cria um cliente Supabase para uso no browser (Client Components).
 * Usa a anon key — todas as operações respeitam o RLS.
 * Não tem acesso à service_role key (que fica apenas no servidor).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
