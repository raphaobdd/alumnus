import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AttendanceCalendar } from "@/components/presencas/AttendanceCalendar";

type Props = { params: Promise<{ subjectId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subjectId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("subjects").select("name").eq("id", subjectId).single();
  return { title: `Presenças — ${data?.name ?? "Matéria"}` };
}

export default async function PresencasSubjectPage({ params }: Props) {
  const { subjectId } = await params;
  const supabase = await createClient();

  const [{ data: subject }, { data: attendance }] = await Promise.all([
    supabase.from("subjects").select("*").eq("id", subjectId).single(),
    supabase.from("attendance").select("*").eq("subject_id", subjectId).order("date"),
  ]);

  if (!subject) notFound();

  const total = (attendance ?? []).length;
  const absences = (attendance ?? []).filter((a) => !a.present).length;
  const pct = total > 0 ? ((total - absences) / total) * 100 : null;
  const absencesRemaining = subject.max_absences != null ? subject.max_absences - absences : null;

  return (
    <>
      <div className="animate-fade-in">
        <Link href="/presencas" style={{ display:"inline-flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text-muted)",textDecoration:"none",marginBottom:20,transition:"color var(--transition)" }}>
          ← Voltar para Presenças
        </Link>

        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,marginBottom:28,flexWrap:"wrap" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:4,height:40,borderRadius:2,background:subject.color,flexShrink:0 }} />
            <div>
              <h1 style={{ fontSize:22,fontWeight:800,color:"var(--text-primary)",marginBottom:2 }}>{subject.name}</h1>
              <p style={{ fontSize:13,color:"var(--text-muted)" }}>
                {[subject.professor, subject.semester].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          <div style={{ display:"flex",gap:12 }}>
            {[
              { label:"Frequência", value: pct !== null ? `${pct.toFixed(0)}%` : "--",
                color: pct === null ? "var(--text-muted)" : pct >= 75 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)" },
              { label:"Faltas", value: absences, color:"var(--danger)" },
              absencesRemaining !== null
                ? { label:"Restam", value: Math.max(0, absencesRemaining), color: absencesRemaining <= 0 ? "var(--danger)" : absencesRemaining <= 3 ? "var(--warning)" : "var(--success)" }
                : null,
            ].filter(Boolean).map((stat) => stat && (
              <div key={stat.label} style={{ textAlign:"center",padding:"12px 16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",minWidth:80 }}>
                <div style={{ fontSize:24,fontWeight:800,color:stat.color,lineHeight:1 }}>{stat.value}</div>
                <div style={{ fontSize:10,color:"var(--text-muted)",marginTop:4,textTransform:"uppercase",letterSpacing:".05em" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {absencesRemaining !== null && absencesRemaining <= 0 && (
          <div style={{ background:"var(--danger-light)",border:"1px solid var(--danger)",borderRadius:"var(--radius-sm)",padding:"10px 14px",fontSize:13,color:"var(--danger)",fontWeight:600,marginBottom:20 }}>
            ⛔ Você atingiu o limite de faltas nesta matéria. Você está em risco de reprovação por frequência.
          </div>
        )}

        {absencesRemaining !== null && absencesRemaining > 0 && absencesRemaining <= 3 && (
          <div style={{ background:"var(--warning-light)",border:"1px solid var(--warning)",borderRadius:"var(--radius-sm)",padding:"10px 14px",fontSize:13,color:"var(--warning)",fontWeight:600,marginBottom:20 }}>
            ⚠️ Atenção: você pode faltar apenas mais {absencesRemaining} vez{absencesRemaining !== 1 ? "es" : ""} nesta matéria.
          </div>
        )}

        <AttendanceCalendar
          subjectId={subjectId}
          records={attendance ?? []}
        />
      </div>
    </>
  );
}
