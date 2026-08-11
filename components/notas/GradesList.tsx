"use client";

import { useTransition } from "react";
import { deleteGradeAction } from "@/app/actions/grades";
import { toast } from "sonner";
import type { Grade } from "@/types/database";
import { Trash2, Loader2, FileSpreadsheet } from "lucide-react";

interface GradesListProps {
  grades: Grade[];
  subjectId: string;
}

export function GradesList({ grades, subjectId }: GradesListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Excluir a avaliação "${title}"?`)) return;
    startTransition(async () => {
      const result = await deleteGradeAction(id, subjectId);
      if (result.error) toast.error(result.error);
      else toast.success("Avaliação excluída com sucesso");
    });
  };

  if (grades.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--surface-2)",
            color: "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <FileSpreadsheet size={28} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
          Nenhuma avaliação registrada
        </p>
        <p style={{ fontSize: 13 }}>Clique em &ldquo;Adicionar avaliação&rdquo; para começar.</p>
      </div>
    );
  }

  // Soma das porcentagens das avaliações
  const totalPercentage = grades.reduce((acc, g) => {
    const pct = g.weight > 1 ? g.weight : g.weight * 100;
    return acc + pct;
  }, 0);

  return (
    <>
      <style>{`
        .grades-table {
          width: 100%;
          border-collapse: collapse;
        }
        .grades-table th {
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-2);
        }
        .grades-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          color: var(--text-primary);
          vertical-align: middle;
        }
        .grades-table tr:last-child td { border-bottom: none; }
        .grades-table tr:hover td { background: var(--surface-2); }
        .grade-value {
          font-size: 16px;
          font-weight: 700;
        }
        .grades-wrapper {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }
      `}</style>

      <div className="grades-wrapper animate-fade-in">
        <table className="grades-table" aria-label="Lista de avaliações">
          <thead>
            <tr>
              <th>Avaliação</th>
              <th>Nota (0-10)</th>
              <th>Valor (%)</th>
              <th>Data da Prova</th>
              <th style={{ width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => {
              const status =
                grade.value >= 7 ? "success" :
                grade.value >= 5 ? "warning" : "danger";

              const pctVal = grade.weight > 1 ? grade.weight : grade.weight * 100;

              return (
                <tr key={grade.id}>
                  <td style={{ fontWeight: 600 }}>{grade.title}</td>
                  <td>
                    <span
                      className="grade-value"
                      style={{ color: `var(--${status})` }}
                    >
                      {grade.value.toFixed(1)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--primary)" }}>
                    {pctVal.toFixed(0)}%
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {grade.exam_date
                      ? new Date(grade.exam_date + "T00:00:00").toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--danger)", padding: "4px 8px" }}
                      onClick={() => handleDelete(grade.id, grade.title)}
                      disabled={isPending}
                      aria-label={`Excluir ${grade.title}`}
                    >
                      {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
