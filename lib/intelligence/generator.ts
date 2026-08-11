import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DailyReport } from "@/types/database";
import { calculateUserSignals } from "./signals";
import { evaluateRules } from "./rules";

export async function generateUserReport(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodType: "daily" | "weekly" | "monthly" = "daily",
  targetDateStr?: string
): Promise<DailyReport> {
  const reportDate = targetDateStr || new Date().toISOString().slice(0, 10);

  // 1. Calcular Sinais Estatísticos para o Período
  const signals = await calculateUserSignals(supabase, userId, periodType);

  // 2. Avaliar Regras e Formatar Mensagens
  const evaluation = evaluateRules(signals);

  // 3. Montar Texto Consolidado do Relatório
  const periodTitle =
    periodType === "monthly"
      ? "Relatório Acadêmico Mensal"
      : periodType === "weekly"
      ? "Relatório Acadêmico Semanal"
      : "Relatório Acadêmico Diário";

  const header = `${periodTitle} — ${new Date(reportDate + "T00:00:00").toLocaleDateString("pt-BR")}`;
  const statusBadge =
    evaluation.overallRisk === "high"
      ? "🔴 RISCO ALTO IDENTIFICADO"
      : evaluation.overallRisk === "attention"
      ? "🟡 ATENÇÃO NECESSÁRIA"
      : "🟢 STATUS NORMAL";

  const messageBlocks = evaluation.messages.map((m) => {
    const icon =
      m.level === "high"
        ? "[ALERTA CRÍTICO]"
        : m.level === "attention"
        ? "[ATENÇÃO]"
        : m.level === "positive"
        ? "[DESTAQUE POSITIVO]"
        : "[INFORMAÇÃO]";

    let block = `${icon} ${m.title}\n${m.text}`;
    if (m.suggestedAction) {
      block += `\n👉 Ação Sugerida: ${m.suggestedAction}`;
    }
    return block;
  });

  // Ranking de Risco Resumido no Texto
  const highRiskSubjects = signals.subjectRiskRanking.filter((s) => s.riskLevel !== "ok");
  let rankingText = "";
  if (highRiskSubjects.length > 0) {
    rankingText = "\n\n📌 Matérias que Exigem Atenção Imediata:\n" +
      highRiskSubjects
        .map((s) => `• ${s.subjectName} (Risco: ${s.riskScore}/100) — ${s.primaryReason}\n  💡 ${s.suggestedAction}`)
        .join("\n");
  }

  const reportText = `${header}\nStatus: ${statusBadge}\n\n${messageBlocks.join("\n\n")}${rankingText}`;

  // 4. Idempotent UPSERT no Supabase (com period_type na constraint)
  const { data, error } = await supabase
    .from("daily_reports")
    .upsert(
      {
        user_id: userId,
        report_date: reportDate,
        period_type: periodType,
        signals_snapshot: signals as unknown as Database["public"]["Tables"]["daily_reports"]["Insert"]["signals_snapshot"],
        report_text: reportText,
        risk_level: evaluation.overallRisk,
      },
      { onConflict: "user_id, report_date, period_type" }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Erro ao gerar relatório (${periodType}): ${error?.message || "Falha desconhecida"}`);
  }

  return data;
}

// Mantido para retrocompatibilidade
export async function generateUserDailyReport(
  supabase: SupabaseClient<Database>,
  userId: string,
  targetDateStr?: string
): Promise<DailyReport> {
  return generateUserReport(supabase, userId, "daily", targetDateStr);
}
