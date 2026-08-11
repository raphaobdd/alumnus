import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

// ============================================================
// Rate Limiting — Sliding window em memória
// ⚠️ Funciona apenas para single-instance (Vercel serverless).
// Para múltiplas instâncias (produção escalonada), use Upstash Redis.
// ============================================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true; // permitido
  }

  if (record.count >= maxRequests) {
    return false; // bloqueado
  }

  record.count++;
  return true; // permitido
}

// Limpar entradas expiradas a cada 100 requisições (evitar vazamento de memória)
let cleanupCounter = 0;
function cleanupRateLimitMap() {
  cleanupCounter++;
  if (cleanupCounter % 100 === 0) {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) rateLimitMap.delete(key);
    }
  }
}

// ============================================================
// Middleware Principal
// ============================================================
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting em rotas de autenticação
  const isAuthRoute =
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/signup";

  if (isAuthRoute) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const key = `${ip}:${pathname}`;
    cleanupRateLimitMap();

    // Máx 10 tentativas por minuto por IP
    const allowed = checkRateLimit(key, 10, 60 * 1000);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Muitas tentativas. Aguarde um minuto e tente novamente.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  }

  // ============================================================
  // Refresh automático de sessão Supabase
  // ============================================================
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            // Sessão descontinuada ao fechar o navegador: remove maxAge e expires persistentes
            const sessionCookieOptions = {
              ...options,
              maxAge: undefined,
              expires: undefined,
            };
            supabaseResponse.cookies.set(name, value, sessionCookieOptions);
          });
        },
      },
    }
  );

  const isProtectedRoute = pathname.startsWith("/notas") ||
    pathname.startsWith("/tarefas") ||
    pathname.startsWith("/presencas") ||
    pathname.startsWith("/rotina") ||
    pathname.startsWith("/relatorio") ||
    pathname.startsWith("/calendario");

  const isPublicAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/update-password" ||
    pathname.startsWith("/auth/");

  // Se não for rota protegida nem de autenticação pública (ex: api/cron), retorna imediatamente sem chamada de rede
  if (!isProtectedRoute && !isPublicAuthRoute) {
    return supabaseResponse;
  }

  // Obter usuário autenticado apenas quando necessário
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redireciona para login se tentar acessar rota protegida sem sessão
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redireciona para dashboard se já autenticado tentar acessar login/signup
  if (isPublicAuthRoute && user && pathname !== "/update-password" && !pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/notas", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Aplica middleware a todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - Arquivos com extensão (js, css, png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
