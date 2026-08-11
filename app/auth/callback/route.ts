import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback OAuth e magic link do Supabase.
 * Troca o code por uma sessão e redireciona para o destino.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/notas";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redireciona para a rota solicitada (ex: /update-password)
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Em caso de erro, redireciona para login com mensagem
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
