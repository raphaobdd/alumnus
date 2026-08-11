import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GradesList } from "@/components/notas/GradesList";
import { AddGradeForm } from "@/components/notas/AddGradeForm";
import { EditSubjectModal } from "@/components/notas/EditSubjectModal";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { SubjectWithStats } from "@/types/database";

type Props = { params: Promise<{ subjectId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subjectId } = await params;
  const supabase = await createClient();
  const { data: subject } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", subjectId)
    .single();
  return { title: `${subject?.name ?? "Matéria"} | AcadêmicoApp` };
}

export default async function SubjectPage({ params }: Props) {
  const { subjectId } = await params;
  const supabase = await createClient();

  const [{ data: subject }, { data: grades }, { data: attendance }] = await Promise.all([
    supabase.from("subjects").select("*").eq("id", subjectId).single(),
    supabase.from("grades").select("*").eq("subject_id", subjectId).order("created_at"),
    supabase.from("attendance").select("*").eq("subject_id", subjectId),
  ]);

  if (!subject) notFound();

  // Média ponderada
  const allGrades = grades ?? [];
  const totalWeight = allGrades.reduce((sum, g) => sum + g.weight, 0);
  const weightedSum = allGrades.reduce((sum, g) => sum + g.value * g.weight, 0);
  const average = totalWeight > 0 ? weightedSum / totalWeight : null;

  const gradeStatus =
    average === null ? null :
    average >= 7 ? "success" :
    average >= 5 ? "warning" : "danger";

  const statusLabel =
    gradeStatus === "success" ? "Aprovado" :
    gradeStatus === "warning" ? "Em recuperação" :
    gradeStatus === "danger" ? "Reprovado" : "";

  const allAttendance = attendance ?? [];
  const totalAbsences = allAttendance.filter((a) => !a.present).length;
  const totalClasses = allAttendance.length;
  const attendancePercentage = totalClasses > 0 ? (allAttendance.filter((a) => a.present).length / totalClasses) * 100 : null;
  const absencesRemaining = subject.max_absences != null ? subject.max_absences - totalAbsences : null;

  const subjectWithStats: SubjectWithStats = {
    ...subject,
    averageGrade: average,
    totalAbsences,
    attendancePercentage,
    absencesRemaining,
  };

  return (
    <>
      <style>{`
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
          margin-bottom: 20px;
          transition: color var(--transition);
        }
        .back-link:hover { color: var(--primary); }
        .subject-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .subject-color-bar {
          width: 4px;
          height: 40px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .subject-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .subject-name {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .subject-meta {
          font-size: 13px;
          color: var(--text-muted);
        }
        .average-display {
          text-align: center;
          padding: 16px 24px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          min-width: 120px;
        }
        .average-value {
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
        }
        .average-label {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }
      `}</style>

      <div className="animate-fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Link href="/notas" className="back-link" style={{ marginBottom: 0 }}>
            <ArrowLeft size={16} />
            Voltar para Notas
          </Link>

          <EditSubjectModal
            subject={subjectWithStats}
            initialEvaluations={allGrades}
          />
        </div>

        <div className="subject-header">
          <div className="subject-info">
            <div
              className="subject-color-bar"
              style={{ background: subject.color }}
            />
            <div>
              <h1 className="subject-name">{subject.name}</h1>
              <p className="subject-meta">
                {[subject.code, subject.professor, subject.semester]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>

          {average !== null && (
            <div
              className="average-display"
              style={{
                background: `var(--${gradeStatus}-light)`,
                borderColor: `var(--${gradeStatus})`,
              }}
            >
              <div className="average-value" style={{ color: `var(--${gradeStatus})` }}>
                {average.toFixed(1)}
              </div>
              <div className="average-label">{statusLabel}</div>
            </div>
          )}
        </div>

        <div className="section-header">
          <h2 className="section-title">Avaliações ({allGrades.length})</h2>
          <AddGradeForm subjectId={subjectId} />
        </div>

        <GradesList grades={allGrades} subjectId={subjectId} />
      </div>
    </>
  );
}
