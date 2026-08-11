import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateUserDailyReport } from "@/lib/intelligence/generator";

export async function GET(req: NextRequest) {
  return handleCronJob(req);
}

export async function POST(req: NextRequest) {
  return handleCronJob(req);
}

async function handleCronJob(req: NextRequest) {
  // 1. Validação de Autorização (Bearer Token / Secret)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const adminSupabase = await createAdminClient();
    const todayStr = new Date().toISOString().slice(0, 10);

    // 2. Buscar lista de usuários únicos com dados nas tabelas principais
    const { data: usersData, error: usersError } = await adminSupabase
      .from("subjects")
      .select("user_id");

    if (usersError) {
      return NextResponse.json(
        { error: `Erro ao buscar usuários: ${usersError.message}` },
        { status: 500 }
      );
    }

    const uniqueUserIds = Array.from(
      new Set((usersData ?? []).map((u) => u.user_id))
    );

    let processed = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    // 3. Processar relatório diário idempotente para cada usuário
    for (const userId of uniqueUserIds) {
      try {
        await generateUserDailyReport(adminSupabase, userId, todayStr);
        processed++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
        errors.push({ userId, error: errorMsg });
      }
    }

    return NextResponse.json({
      success: true,
      reportDate: todayStr,
      totalUsers: uniqueUserIds.length,
      processedCount: processed,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Falha na execução do job";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
