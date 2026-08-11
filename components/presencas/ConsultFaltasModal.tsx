"use client";

import { useState } from "react";
import type { Subject, Attendance } from "@/types/database";
import { AlertTriangle, AlertOctagon, X, Search, Calendar, CheckCircle2, Percent } from "lucide-react";

interface SubjectAccounting {
  id: string;
  name: string;
  color: string;
  professor: string | null;
  max_absences: number | null;
  fuiCount: number;
  naoFuiCount: number;
  semChamadaCount: number;
  pct: number | null;
  absencesRemaining: number | null;
}

interface ConsultFaltasModalProps {
  subjects: SubjectAccounting[];
  records: Attendance[];
}

export function ConsultFaltasModal({ subjects, records }: ConsultFaltasModalProps) {
  const [open, setOpen] = useState(false);
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all");

  const totalFui = subjects.reduce((acc, s) => acc + s.fuiCount, 0);
  const totalNaoFui = subjects.reduce((acc, s) => acc + s.naoFuiCount, 0);
  const overallEvaluated = totalFui + totalNaoFui;
  const overallPct = overallEvaluated > 0 ? (totalFui / overallEvaluated) * 100 : 100;

  const filteredSubjects = subjects.filter((s) =>
    filterSubjectId === "all" ? true : s.id === filterSubjectId
  );

  const absenceRecords = records.filter((r) => !r.present);

  return (
    <>
      <button
        id="consult-faltas-btn"
        className="btn btn-secondary"
        onClick={() => setOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      >
        <Percent size={16} className="text-primary" />
        Frequência Geral: {overallPct.toFixed(0)}%
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 16,
            animation: "fade-in 0.15s ease",
          }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              width: "100%",
              maxWidth: 640,
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "var(--shadow-lg)",
              animation: "scale-in 0.2s ease",
            }}
            role="dialog"
            aria-modal
            aria-label="Consulta de Frequência e Faltas"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Percent size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                    Consulta de Frequência & Faltas
                  </h2>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Frequência Geral Atual: <strong style={{ color: "var(--primary)" }}>{overallPct.toFixed(1)}%</strong> ({totalNaoFui} faltas registradas)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Filtro por Matéria */}
            <div style={{ marginBottom: 18 }}>
              <label className="label" htmlFor="filter-subject-select">Filtrar por matéria</label>
              <select
                id="filter-subject-select"
                className="input"
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
              >
                <option value="all">Todas as matérias</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.pct !== null ? `${s.pct.toFixed(0)}% presença` : "100%"})
                  </option>
                ))}
              </select>
            </div>

            {/* Lista com Porcentagem de Presença em Destaque */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filteredSubjects.map((sub) => {
                const subAbsences = absenceRecords.filter((r) => r.subject_id === sub.id);
                const isDanger = sub.absencesRemaining !== null && sub.absencesRemaining <= 0;
                const isWarning = sub.absencesRemaining !== null && sub.absencesRemaining > 0 && sub.absencesRemaining <= 3;
                const pctValue = sub.pct !== null ? sub.pct : 100;
                const pctColor =
                  pctValue < 75 ? "var(--danger)" : pctValue < 85 ? "var(--warning)" : "var(--accent)";

                return (
                  <div
                    key={sub.id}
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderLeft: `4px solid ${sub.color}`,
                      borderRadius: "var(--radius-sm)",
                      padding: 16,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: sub.color }}>{sub.name}</h3>
                        {sub.professor && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Prof. {sub.professor}</div>
                        )}
                      </div>

                      {/* Porcentagem de Presença Destacada */}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: pctColor, lineHeight: 1 }}>
                          {pctValue.toFixed(0)}%
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginTop: 2 }}>
                          Presença
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progresso da Matéria */}
                    <div style={{ height: 6, background: "var(--surface)", borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ width: `${pctValue}%`, height: "100%", background: pctColor, borderRadius: 99 }} />
                    </div>

                    {/* Resumo de Faltas */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                      <span>Faltas: <strong style={{ color: "var(--danger)" }}>{sub.naoFuiCount}</strong></span>
                      <span>Limite: <strong>{sub.max_absences != null ? sub.max_absences : "Sem limite"}</strong></span>
                      {sub.absencesRemaining !== null && (
                        <span>Restantes: <strong style={{ color: pctColor }}>{sub.absencesRemaining}</strong></span>
                      )}
                    </div>

                    {/* Datas exatas das faltas */}
                    {subAbsences.length > 0 && (
                      <div style={{ marginTop: 8, borderTop: "1px dashed var(--border)", paddingTop: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
                          Datas das faltas:
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {subAbsences.map((r) => (
                            <span
                              key={r.id}
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 4,
                                background: "var(--danger-light)",
                                color: "var(--danger)",
                                border: "1px solid var(--danger)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Calendar size={10} />
                              {new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
