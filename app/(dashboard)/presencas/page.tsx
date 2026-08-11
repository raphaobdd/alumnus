import type { Metadata } from "next";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/supabase/auth-cache";
import { UnifiedAttendanceCalendar } from "@/components/presencas/UnifiedAttendanceCalendar";
import { ConsultFaltasModal } from "@/components/presencas/ConsultFaltasModal";
import { SemesterSetupModal } from "@/components/semestre/SemesterSetupModal";
import type { Subject, Attendance } from "@/types/database";
import { CalendarCheck, AlertTriangle, AlertOctagon, CheckCircle2, Minus, X, Check } from "lucide-react";

export const metadata: Metadata = { title: "Presenças & Faltas" };

export default async function PresencasPage() {
  const { supabase } = await getAuthenticatedUser();

  const [{ data: subjects }, { data: attendance }, { data: schedule }] = await Promise.all([
    supabase.from("subjects").select("*").order("name"),
    supabase.from("attendance").select("*").order("date", { ascending: false }),
    supabase.from("schedule").select("subject_id, weekday"),
  ]);

  const allSubjects = (subjects ?? []) as Subject[];
  const allRecords = (attendance ?? []) as Attendance[];
  const allSchedules = (schedule ?? []) as Array<{ subject_id: string; weekday: number }>;

  // Contabilização customizada por matéria (Sem chamada = Presença Computada por Padrão)
  const subjectsAccounting = allSubjects.map((subject) => {
    const subRecords = allRecords.filter((a) => a.subject_id === subject.id);
    const fuiCount = subRecords.filter((a) => a.present && a.notes !== "sem_chamada").length;
    const semChamadaCount = subRecords.filter((a) => a.notes === "sem_chamada").length;
    const naoFuiCount = subRecords.filter((a) => !a.present).length;

    // Total de Presenças (Fui + Sem chamada por padrão)
    const totalPresences = fuiCount + semChamadaCount;
    const totalClasses = subRecords.length;

    // Porcentagem: (Total de Presenças / Total de Aulas Avaliadas) * 100
    const pct = totalClasses > 0 ? (totalPresences / totalClasses) * 100 : null;
    const absencesRemaining = subject.max_absences != null ? subject.max_absences - naoFuiCount : null;

    return {
      ...subject,
      fuiCount,
      naoFuiCount,
      semChamadaCount,
      totalPresences,
      totalRecords: totalClasses,
      pct,
      absencesRemaining,
    };
  });

  const atRiskCount = subjectsAccounting.filter(
    (s) => s.absencesRemaining !== null && s.absencesRemaining <= 3
  ).length;

  return (
    <>
      <style>{`
        .att-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        .att-summary-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 18px 20px;
          box-shadow: var(--shadow-sm);
        }
        .att-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin: 14px 0;
          padding: 10px;
          background: var(--surface-2);
          border-radius: var(--radius-sm);
          text-align: center;
        }
        .att-stat-val { font-size: 16px; font-weight: 800; }
        .att-stat-lbl { font-size: 10px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
        .progress-bar { height: 6px; background: var(--surface-2); border-radius: 99px; overflow: hidden; margin-bottom: 10px; }
        .progress-fill { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
      `}</style>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              Presenças & Controle de Faltas
            </h1>
            {atRiskCount > 0 && (
              <p style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={15} />
                {atRiskCount} matéria{atRiskCount !== 1 ? "s" : ""} em risco de reprovação por falta
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <SemesterSetupModal forceOpen={allSubjects.length === 0} />
            <ConsultFaltasModal subjects={subjectsAccounting} records={allRecords} />
          </div>
        </div>

        {/* 1. Calendário Único Unificado com Filtro de Aulas do Dia */}
        <UnifiedAttendanceCalendar
          subjects={allSubjects}
          records={allRecords}
          schedule={allSchedules}
        />

        {/* 2. Contabilização Customizada por Matéria */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16 }}>
          Contabilização Customizada por Matéria
        </h2>

        {subjectsAccounting.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 24px", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 14, marginBottom: 12 }}>Nenhuma matéria cadastrada no semestre.</p>
            <SemesterSetupModal forceOpen={allSubjects.length === 0} />
          </div>
        ) : (
          <div className="att-summary-grid">
            {subjectsAccounting.map((s) => {
              const isDanger = s.absencesRemaining !== null && s.absencesRemaining <= 0;
              const isWarning = s.absencesRemaining !== null && s.absencesRemaining > 0 && s.absencesRemaining <= 3;
              const statusColor = isDanger ? "var(--danger)" : isWarning ? "var(--warning)" : "var(--accent)";

              return (
                <div key={s.id} className="att-summary-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.name}</div>
                    {s.absencesRemaining !== null && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: isDanger ? "var(--danger-light)" : isWarning ? "var(--warning-light)" : "var(--accent-light)",
                          color: statusColor,
                        }}
                      >
                        {isDanger ? "Limite Atingido" : `${s.absencesRemaining} restantes`}
                      </span>
                    )}
                  </div>

                  {s.professor && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                      Prof. {s.professor}
                    </div>
                  )}

                  {/* Estatísticas Customizadas (Sem chamada = Presença por padrão) */}
                  <div className="att-stat-row">
                    <div>
                      <div className="att-stat-val" style={{ color: "var(--accent)" }}>{s.fuiCount}</div>
                      <div className="att-stat-lbl">Fui</div>
                    </div>
                    <div>
                      <div className="att-stat-val" style={{ color: "var(--danger)" }}>{s.naoFuiCount}</div>
                      <div className="att-stat-lbl">Não fui</div>
                    </div>
                    <div>
                      <div className="att-stat-val" style={{ color: "var(--warning)" }}>{s.semChamadaCount}</div>
                      <div className="att-stat-lbl">Sem chamada</div>
                    </div>
                  </div>

                  {/* Barra de Frequência Real */}
                  {s.pct !== null && (
                    <>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${s.pct}%`, background: statusColor }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                        <span>Frequência Real (com presença padrão)</span>
                        <span style={{ fontWeight: 700, color: statusColor }}>{s.pct.toFixed(0)}%</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
