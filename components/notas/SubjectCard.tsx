"use client";

import Link from "next/link";
import type { SubjectWithStats } from "@/types/database";
import { deleteSubjectAction } from "@/app/actions/grades";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Loader2, ChevronRight, BookOpen } from "lucide-react";
import { EditSubjectModal } from "./EditSubjectModal";

interface SubjectCardProps {
  subject: SubjectWithStats;
}

export function SubjectCard({ subject }: SubjectCardProps) {
  const [isPending, startTransition] = useTransition();

  const gradeStatus =
    subject.averageGrade === null ? null :
    subject.averageGrade >= 7 ? "success" :
    subject.averageGrade >= 5 ? "warning" : "danger";

  const absenceStatus =
    subject.absencesRemaining === null ? null :
    subject.absencesRemaining <= 0 ? "danger" :
    subject.absencesRemaining <= 3 ? "warning" : "success";

  const handleDelete = () => {
    if (!confirm(`Excluir "${subject.name}"? Todas as notas e presenças serão deletadas.`)) return;
    startTransition(async () => {
      const result = await deleteSubjectAction(subject.id, subject.name);
      if (result.error) toast.error(result.error);
      else toast.success("Matéria excluída com sucesso");
    });
  };

  return (
    <>
      <style>{`
        .subject-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          transition: box-shadow var(--transition), transform var(--transition), border-color var(--transition);
          display: flex;
          flex-direction: column;
        }
        .subject-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--border-strong);
          transform: translateY(-2px);
        }
        .subject-card-stripe {
          height: 4px;
        }
        .subject-card-body {
          padding: 18px;
          flex: 1;
        }
        .subject-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 16px;
        }
        .subject-card-title-group {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .subject-card-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: var(--surface-2);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .subject-card-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          text-decoration: none;
          line-height: 1.3;
        }
        .subject-card-name:hover {
          color: var(--primary);
        }
        .subject-card-code {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .subject-card-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .stat-box {
          padding: 12px 10px;
          border-radius: var(--radius-sm);
          text-align: center;
          border: 1px solid transparent;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 800;
          line-height: 1;
        }
        .stat-label {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .subject-card-footer {
          padding: 10px 16px;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
      `}</style>

      <div className="subject-card">
        <div className="subject-card-stripe" style={{ background: subject.color || "var(--primary)" }} />

        <div className="subject-card-body">
          <div className="subject-card-header">
            <div className="subject-card-title-group">
              <div className="subject-card-icon">
                <BookOpen size={18} />
              </div>
              <div>
                <Link href={`/notas/${subject.id}`} className="subject-card-name">
                  {subject.name}
                </Link>
                {(subject.code || subject.professor) && (
                  <p className="subject-card-code">
                    {[subject.code, subject.professor].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="subject-card-stats">
            {/* Média */}
            <div
              className="stat-box"
              style={{
                background: gradeStatus ? `var(--${gradeStatus}-light)` : "var(--surface-2)",
                borderColor: gradeStatus ? `color-mix(in srgb, var(--${gradeStatus}) 20%, transparent)` : "var(--border)",
              }}
            >
              <div
                className="stat-value"
                style={{ color: gradeStatus ? `var(--${gradeStatus})` : "var(--text-muted)" }}
              >
                {subject.averageGrade !== null ? subject.averageGrade.toFixed(1) : "--"}
              </div>
              <div className="stat-label">Média</div>
            </div>

            {/* Faltas */}
            <div
              className="stat-box"
              style={{
                background: absenceStatus ? `var(--${absenceStatus}-light)` : "var(--surface-2)",
                borderColor: absenceStatus ? `color-mix(in srgb, var(--${absenceStatus}) 20%, transparent)` : "var(--border)",
              }}
            >
              <div
                className="stat-value"
                style={{ color: absenceStatus ? `var(--${absenceStatus})` : "var(--text-muted)" }}
              >
                {subject.totalAbsences}
              </div>
              <div className="stat-label">
                Faltas
                {subject.max_absences != null ? ` / ${subject.max_absences}` : ""}
              </div>
            </div>
          </div>
        </div>

        <div className="subject-card-footer">
          <Link href={`/notas/${subject.id}`} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
            Ver notas
            <ChevronRight size={14} />
          </Link>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <EditSubjectModal subject={subject} />

            <button
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--danger)", padding: "5px 8px" }}
              onClick={handleDelete}
              disabled={isPending}
              aria-label={`Excluir ${subject.name}`}
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
