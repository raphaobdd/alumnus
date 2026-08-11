import type { Metadata } from "next";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/supabase/auth-cache";
import { GenerateReportButton } from "@/components/relatorio/GenerateReportButton";
import type { DailyReport } from "@/types/database";
import type { SignalsSnapshot } from "@/lib/intelligence/signals";
import {
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BookOpen,
  Clock,
  Flame,
  ArrowRight,
  Sun,
  Zap,
} from "lucide-react";

export const metadata: Metadata = { title: "Relatório de Inteligência | AcadêmicoApp" };

interface PageProps {
  searchParams?: Promise<{ period?: string }>;
}

export default async function RelatorioPage({ searchParams }: PageProps) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const resolvedParams = searchParams ? await searchParams : {};
  const activePeriod = (resolvedParams.period as "daily" | "weekly" | "monthly") || "daily";

  const todayStr = new Date().toISOString().slice(0, 10);

  // Buscar todos os relatórios do usuário ordenados por data
  const { data: reports } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("user_id", user.id)
    .order("report_date", { ascending: false });

  const allReports = (reports ?? []) as DailyReport[];

  // Filtrar relatórios do período ativo (considerando 'daily' como fallback para registros antigos)
  const periodReports = allReports.filter(
    (r) => (r.period_type || "daily") === activePeriod
  );

  const activeReport = periodReports.find((r) => r.report_date === todayStr) || periodReports[0];

  const signals = activeReport
    ? (activeReport.signals_snapshot as unknown as SignalsSnapshot)
    : null;

  const periodTitleLabel =
    activePeriod === "monthly" ? "Mensal" : activePeriod === "weekly" ? "Semanal" : "Diário";

  return (
    <>
      <style>{`
        .report-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .report-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .report-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .period-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-2);
          padding: 4px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          margin-bottom: 24px;
        }
        .period-tab {
          padding: 8px 18px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .period-tab.active {
          background: var(--surface);
          color: var(--accent);
          box-shadow: var(--shadow-sm);
        }
        .report-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: var(--shadow-sm);
        }
        .risk-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-radius: var(--radius);
          margin-bottom: 20px;
          font-weight: 700;
          font-size: 14px;
        }
        .risk-banner.high {
          background: var(--danger-light);
          color: var(--danger);
          border: 1px solid var(--danger);
        }
        .risk-banner.attention {
          background: var(--warning-light);
          color: var(--warning);
          border: 1px solid var(--warning);
        }
        .risk-banner.none {
          background: var(--accent-light);
          color: var(--accent);
          border: 1px solid var(--accent);
        }
        .ranking-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 14px;
        }
        .ranking-card {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
        }
        .action-box {
          background: rgba(99, 102, 241, 0.08);
          border-left: 3px solid var(--accent);
          padding: 10px 14px;
          border-radius: 4px;
          margin-top: 10px;
          font-size: 13px;
          color: var(--text-primary);
        }
        .report-text-pre {
          white-space: pre-wrap;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-primary);
          background: var(--surface-2);
          padding: 18px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          margin-bottom: 24px;
        }
        .signals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
          margin-top: 16px;
        }
        .signal-metric-box {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 14px;
        }
        .signal-metric-val {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
        }
        .signal-metric-lbl {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 4px;
          font-weight: 600;
        }
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 13px;
        }
      `}</style>

      <div>
        {/* Cabeçalho da Página */}
        <div className="report-page-header">
          <div>
            <h1 className="report-title">
              <Sparkles size={22} className="text-accent" />
              Camada de Inteligência Acadêmica ({periodTitleLabel})
            </h1>
            <p className="report-subtitle">
              Análise estatística determinística com diagnóstico de risco, tendências de notas e rotina
            </p>
          </div>
          <GenerateReportButton hasReport={!!activeReport} periodType={activePeriod} />
        </div>

        {/* Seletor de Período (Tabs) */}
        <div className="period-tabs">
          <Link
            href="/relatorio?period=daily"
            className={`period-tab ${activePeriod === "daily" ? "active" : ""}`}
          >
            Visão Diária
          </Link>
          <Link
            href="/relatorio?period=weekly"
            className={`period-tab ${activePeriod === "weekly" ? "active" : ""}`}
          >
            Visão Semanal
          </Link>
          <Link
            href="/relatorio?period=monthly"
            className={`period-tab ${activePeriod === "monthly" ? "active" : ""}`}
          >
            Visão Mensal
          </Link>
        </div>

        {!activeReport ? (
          <div className="report-card text-center" style={{ padding: "48px 24px", textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--accent-light)",
                color: "var(--accent)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Sparkles size={32} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Nenhum relatório {periodTitleLabel.toLowerCase()} gerado
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24, maxWidth: 460, margin: "0 auto 24px" }}>
              Clique no botão de geração para processar seus dados estatísticos (notas, faltas, carga de estudo e rotina).
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Banner de Risco Geral */}
            <div className="report-card">
              <div className={`risk-banner ${activeReport.risk_level}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {activeReport.risk_level === "high" ? (
                    <AlertOctagon size={20} />
                  ) : activeReport.risk_level === "attention" ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                  <span>
                    {activeReport.risk_level === "high"
                      ? "Risco Alto Identificado — Ação Imediata Recomendada"
                      : activeReport.risk_level === "attention"
                      ? "Atenção Necessária — Itens com Alerta Cadastrados"
                      : "Status Normal — Tudo em Dia na Sua Rotina Acadêmica"}
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500 }}>
                  {new Date(activeReport.report_date + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              </div>

              {/* Ranking de Risco de Matérias */}
              {signals?.subjectRiskRanking && signals.subjectRiskRanking.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <Flame size={18} style={{ color: "var(--danger)" }} />
                    Ranking de Risco por Matéria (Prioridade de Atenção Agora)
                  </h3>
                  <div className="ranking-grid">
                    {signals.subjectRiskRanking.map((subRank) => (
                      <div key={subRank.subjectId} className="ranking-card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                background: subRank.color || "var(--primary)",
                              }}
                            />
                            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                              {subRank.subjectName}
                            </span>
                          </div>
                          <span
                            className="badge"
                            style={{
                              background:
                                subRank.riskLevel === "high"
                                  ? "var(--danger-light)"
                                  : subRank.riskLevel === "attention"
                                  ? "var(--warning-light)"
                                  : "var(--accent-light)",
                              color:
                                subRank.riskLevel === "high"
                                  ? "var(--danger)"
                                  : subRank.riskLevel === "attention"
                                  ? "var(--warning)"
                                  : "var(--accent)",
                            }}
                          >
                            {subRank.riskLevel === "high"
                              ? `Risco Alto (${subRank.riskScore} pts)`
                              : subRank.riskLevel === "attention"
                              ? `Atenção (${subRank.riskScore} pts)`
                              : `Normal (${subRank.riskScore} pts)`}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
                          • {subRank.primaryReason}
                        </p>
                        {subRank.suggestedAction && (
                          <div className="action-box">
                            <strong>👉 Ação Sugerida:</strong> {subRank.suggestedAction}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card de Carga de Estudo e Rotina */}
              {signals?.workload && signals?.routine && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap size={18} style={{ color: "var(--accent)" }} />
                    Análise de Carga de Estudo e Distribuição da Rotina
                  </h3>
                  <div className="signals-grid">
                    <div className="signal-metric-box">
                      <div className="signal-metric-val" style={{ color: "var(--accent)" }}>
                        {signals.workload.totalWeeklyDemandHours}h
                      </div>
                      <div className="signal-metric-lbl">
                        Carga Semanal ({signals.workload.totalWeeklyClassHours}h aulas + {signals.workload.pendingTaskEstimatedHours}h tarefas)
                      </div>
                    </div>
                    <div className="signal-metric-box">
                      <div className="signal-metric-val" style={{ color: signals.routine.peakDays.length > 0 ? "var(--warning)" : "var(--text-primary)" }}>
                        {signals.routine.peakDays.length > 0 ? signals.routine.peakDays.join(", ") : "Nenhum"}
                      </div>
                      <div className="signal-metric-lbl">Dias de Pico de Rotina (3+ compromissos)</div>
                    </div>
                    <div className="signal-metric-box">
                      <div className="signal-metric-val" style={{ color: "var(--accent)" }}>
                        {signals.routine.idleDays.length > 0 ? signals.routine.idleDays.join(", ") : "Nenhum"}
                      </div>
                      <div className="signal-metric-lbl">Dias Livres na Semana (Oportunidades)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Texto do Relatório Concatenado */}
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                Relatório Técnico Consolidado
              </h3>
              <div className="report-text-pre">{activeReport.report_text}</div>

              {/* Métricas Globais */}
              {signals && (
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                    Métricas Globais do Sistema
                  </h3>
                  <div className="signals-grid">
                    <div className="signal-metric-box">
                      <div className="signal-metric-val" style={{ color: "var(--primary)" }}>
                        {signals.subjects?.length ?? 0}
                      </div>
                      <div className="signal-metric-lbl">Matérias Acompanhadas</div>
                    </div>
                    <div className="signal-metric-box">
                      <div className="signal-metric-val" style={{ color: "var(--accent)" }}>
                        {signals.tasks?.completionRate ?? 0}%
                      </div>
                      <div className="signal-metric-lbl">Conclusão de Tarefas</div>
                    </div>
                    <div className="signal-metric-box">
                      <div
                        className="signal-metric-val"
                        style={{ color: (signals.tasks?.overdue ?? 0) > 0 ? "var(--danger)" : "var(--text-muted)" }}
                      >
                        {signals.tasks?.overdue ?? 0}
                      </div>
                      <div className="signal-metric-lbl">Tarefas Atrasadas</div>
                    </div>
                    <div className="signal-metric-box">
                      <div className="signal-metric-val" style={{ color: "var(--info)" }}>
                        {signals.upcomingDates?.length ?? 0}
                      </div>
                      <div className="signal-metric-lbl">Datas Próximas ({activePeriod === "monthly" ? "30d" : activePeriod === "weekly" ? "14d" : "7d"})</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Histórico do Período */}
        {periodReports.length > 0 && (
          <div className="report-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
              Histórico de Relatórios ({periodTitleLabel})
            </h3>
            <div className="history-list">
              {periodReports.map((r) => (
                <div key={r.id} className="history-item">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {r.risk_level === "high" ? (
                      <AlertOctagon size={16} style={{ color: "var(--danger)" }} />
                    ) : r.risk_level === "attention" ? (
                      <AlertTriangle size={16} style={{ color: "var(--warning)" }} />
                    ) : (
                      <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
                    )}
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {new Date(r.report_date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background:
                        r.risk_level === "high"
                          ? "var(--danger-light)"
                          : r.risk_level === "attention"
                          ? "var(--warning-light)"
                          : "var(--accent-light)",
                      color:
                        r.risk_level === "high"
                          ? "var(--danger)"
                          : r.risk_level === "attention"
                          ? "var(--warning)"
                          : "var(--accent)",
                    }}
                  >
                    {r.risk_level === "high" ? "Risco Alto" : r.risk_level === "attention" ? "Atenção" : "Normal"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
