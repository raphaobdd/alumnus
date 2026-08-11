import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

// ============================================================
// Rate Limiting — Sliding window em memória
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
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

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
// Proxy (Next.js 16+ convention)
// ============================================================
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  const isProtectedRoute =
    pathname.startsWith("/notas") ||
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

  if (!isProtectedRoute && !isPublicAuthRoute) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isPublicAuthRoute && user && pathname !== "/update-password" && !pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/notas", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
