import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Cria um cliente Supabase para uso no servidor (Server Components, Server Actions, Route Handlers).
 * Lê e escreve cookies via next/headers para manter a sessão do usuário.
 * Usa a anon key — respeita RLS normalmente.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: undefined,
                expires: undefined,
              })
            );
          } catch {
            // setAll pode lançar em Server Components (read-only)
            // O middleware se encarrega de atualizar a sessão nesses casos
          }
        },
      },
    }
  );
}

/**
 * Cria um cliente admin com a service_role key.
 * ⚠️ NUNCA use no cliente (browser) — bypassa RLS completamente.
 * Use apenas em Server Actions para operações administrativas (ex: audit logs).
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
