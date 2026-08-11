import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/supabase/auth-cache";
import { TasksBoard } from "@/components/tarefas/TasksBoard";
import { AddTaskForm } from "@/components/tarefas/AddTaskForm";
import type { TaskWithSubject, Subject, Grade } from "@/types/database";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Tarefas | AcadêmicoApp" };

export default async function TarefasPage() {
  const { supabase } = await getAuthenticatedUser();

  const [{ data: tasks }, { data: subjects }, { data: grades }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, subjects(name, color)")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("subjects").select("*").order("name"),
    supabase.from("grades").select("*").order("title"),
  ]);

  const pending    = (tasks ?? []).filter((t) => t.status === "pending") as TaskWithSubject[];
  const inProgress = (tasks ?? []).filter((t) => t.status === "in_progress") as TaskWithSubject[];
  const done       = (tasks ?? []).filter((t) => t.status === "done") as TaskWithSubject[];

  const urgentCount = (tasks ?? []).filter((t) => {
    if (!t.due_date || t.status === "done") return false;
    const daysLeft = (new Date(t.due_date).getTime() - Date.now()) / 86400000;
    return daysLeft <= 2;
  }).length;

  return (
    <>
      <style>{`
        .tasks-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .tasks-title { font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.01em; display: flex; align-items: center; }
        .tasks-subtitle { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
        .urgent-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--danger-light);
          color: var(--danger);
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 99px;
          margin-left: 10px;
        }
      `}</style>

      <div>
        <div className="tasks-header">
          <div>
            <h1 className="tasks-title">
              Tarefas
              {urgentCount > 0 && (
                <span className="urgent-badge" aria-label={`${urgentCount} tarefa urgente`}>
                  <AlertTriangle size={14} />
                  {urgentCount} urgente{urgentCount !== 1 ? "s" : ""}
                </span>
              )}
            </h1>
            <p className="tasks-subtitle">
              {(tasks ?? []).length} tarefa{tasks?.length !== 1 ? "s" : ""} no total
            </p>
          </div>
          <AddTaskForm
            subjects={(subjects ?? []) as Subject[]}
            grades={(grades ?? []) as Grade[]}
          />
        </div>

        <TasksBoard pending={pending} inProgress={inProgress} done={done} />
      </div>
    </>
  );
}
