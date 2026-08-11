import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/supabase/auth-cache";
import { WeeklyGrid } from "@/components/rotina/WeeklyGrid";
import { AddScheduleForm } from "@/components/rotina/AddScheduleForm";
import { SemesterSetupModal } from "@/components/semestre/SemesterSetupModal";
import type { ScheduleWithSubject } from "@/types/database";

export const metadata: Metadata = { title: "Grade de Horários" };

export default async function RotinaPage() {
  const { supabase } = await getAuthenticatedUser();

  const [{ data: schedule }, { data: subjects }] = await Promise.all([
    supabase
      .from("schedule")
      .select("*, subjects(name, color, professor)")
      .order("weekday")
      .order("start_time"),
    supabase.from("subjects").select("id, name, color").order("name"),
  ]);

  return (
    <>
      <div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12 }}>
          <div>
            <h1 style={{ fontSize:22,fontWeight:800,color:"var(--text-primary)",letterSpacing:"-0.01em" }}>Grade de Horários</h1>
            <p style={{ fontSize:13,color:"var(--text-muted)",marginTop:2 }}>
              {(schedule ?? []).length} aula{schedule?.length !== 1 ? "s" : ""} cadastrada{schedule?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <SemesterSetupModal forceOpen={(subjects ?? []).length === 0} />
            <AddScheduleForm subjects={subjects ?? []} />
          </div>
        </div>

        <WeeklyGrid
          schedule={(schedule ?? []) as ScheduleWithSubject[]}
          subjects={subjects ?? []}
        />
      </div>
    </>
  );
}
