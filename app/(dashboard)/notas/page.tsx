import Link from "next/link";
import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/supabase/auth-cache";
import { SubjectCard } from "@/components/notas/SubjectCard";
import { AddSubjectForm } from "@/components/notas/AddSubjectForm";
import type { SubjectWithStats } from "@/types/database";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Notas | AcadêmicoApp" };

export default async function NotasPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  // Buscar matérias com notas e presenças
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("name");

  const { data: grades } = await supabase
    .from("grades")
    .select("subject_id, value, weight");

  const { data: attendance } = await supabase
    .from("attendance")
    .select("subject_id, present");

  // Calcular stats por matéria
  const subjectsWithStats: SubjectWithStats[] = (subjects ?? []).map((subject) => {
    const subjectGrades = (grades ?? []).filter((g) => g.subject_id === subject.id);
    const subjectAttendance = (attendance ?? []).filter((a) => a.subject_id === subject.id);

    // Média ponderada
    const totalWeight = subjectGrades.reduce((sum, g) => sum + g.weight, 0);
    const weightedSum = subjectGrades.reduce((sum, g) => sum + g.value * g.weight, 0);
    const averageGrade = totalWeight > 0 ? weightedSum / totalWeight : null;

    // Presenças
    const totalClasses = subjectAttendance.length;
    const absences = subjectAttendance.filter((a) => !a.present).length;
    const attendancePercentage = totalClasses > 0
      ? ((totalClasses - absences) / totalClasses) * 100
      : null;

    const absencesRemaining = subject.max_absences != null
      ? subject.max_absences - absences
      : null;

    return {
      ...subject,
      averageGrade,
      totalAbsences: absences,
      attendancePercentage,
      absencesRemaining,
    };
  });

  return (
    <>
      <style>{`
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .page-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .page-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        .empty-state {
          text-align: center;
          padding: 60px 24px;
          color: var(--text-muted);
        }
        .empty-state-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--surface-2);
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .empty-state-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .empty-state-text {
          font-size: 14px;
          margin-bottom: 24px;
          max-width: 380px;
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>

      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Notas & Boletim</h1>
            <p className="page-subtitle">
              {subjectsWithStats.length} matéria{subjectsWithStats.length !== 1 ? "s" : ""} cadastrada{subjectsWithStats.length !== 1 ? "s" : ""}
            </p>
          </div>
          <AddSubjectForm />
        </div>

        {subjectsWithStats.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-state-icon">
              <BookOpen size={30} />
            </div>
            <p className="empty-state-title">Nenhuma matéria cadastrada</p>
            <p className="empty-state-text">
              Adicione suas matérias para começar a registrar notas e acompanhar seu desempenho.
            </p>
          </div>
        ) : (
          <div className="subjects-grid">
            {subjectsWithStats.map((subject, i) => (
              <div
                key={subject.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <SubjectCard subject={subject} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
