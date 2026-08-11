import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/supabase/auth-cache";
import { ImportantDatesCalendar } from "@/components/calendario/ImportantDatesCalendar";
import { AddImportantDateForm } from "@/components/calendario/AddImportantDateForm";
import type { ImportantDateWithSubject } from "@/types/database";

export const metadata: Metadata = { title: "Calendário de Datas" };

export default async function CalendarioPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const [{ data: importantDates }, { data: subjects }] = await Promise.all([
    supabase
      .from("important_dates")
      .select("*, subjects(name, color)")
      .order("event_date", { ascending: true }),
    supabase.from("subjects").select("id, name, color").order("name"),
  ]);

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
      `}</style>

      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Calendário de Datas Importantes</h1>
            <p className="page-subtitle">
              Acompanhe provas, entregas de trabalhos, eventos e prazos acadêmicos
            </p>
          </div>
          <AddImportantDateForm subjects={subjects ?? []} />
        </div>

        <ImportantDatesCalendar
          importantDates={(importantDates ?? []) as ImportantDateWithSubject[]}
          subjects={subjects ?? []}
        />
      </div>
    </>
  );
}
