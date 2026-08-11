import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DailyReport } from "@/types/database";
import { calculateUserSignals } from "./signals";
import { evaluateRules } from "./rules";

export async function generateUserDailyReport(
  supabase: SupabaseClient<Database>,
  userId: string,
  targetDateStr?: string
): Promise<DailyReport> {
  const reportDate = targetDateStr || new Date().toISOString().slice(0, 10);

  // 1. Calcular Sinais Estatísticos
  const signals = await calculateUserSignals(supabase, userId);

  // 2. Avaliar Regras e Formatar Templates
  const evaluation = evaluateRules(signals);

  // 3. Montar Texto Consolidado do Relatório
  const header = `Relatório Acadêmico Diário — ${new Date(reportDate + "T00:00:00").toLocaleDateString("pt-BR")}`;
  const statusBadge =
    evaluation.overallRisk === "high"
      ? "🔴 RISCO ALTO IDENTIFICADO"
      : evaluation.overallRisk === "attention"
      ? "🟡 ATENÇÃO NECESSÁRIA"
      : "🟢 STATUS NORMAL";

  const messageBlocks = evaluation.messages.map((m) => {
    const icon =
      m.level === "high"
        ? "[ALERTA]"
        : m.level === "attention"
        ? "[ATENÇÃO]"
        : m.level === "positive"
        ? "[POSITIVO]"
        : "[INFO]";
    return `${icon} ${m.title}\n${m.text}`;
  });

  const reportText = `${header}\nStatus: ${statusBadge}\n\n${messageBlocks.join("\n\n")}`;

  // 4. Idempotent UPSERT no Supabase
  const { data, error } = await supabase
    .from("daily_reports")
    .upsert(
      {
        user_id: userId,
        report_date: reportDate,
        signals_snapshot: signals as unknown as Database["public"]["Tables"]["daily_reports"]["Insert"]["signals_snapshot"],
        report_text: reportText,
        risk_level: evaluation.overallRisk,
      },
      { onConflict: "user_id, report_date" }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Erro ao gerar relatório diário: ${error?.message || "Falha desconhecida"}`);
  }

  return data;
}
