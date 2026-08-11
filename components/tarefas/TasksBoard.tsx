"use client";

import { useTransition } from "react";
import { updateTaskStatusAction, deleteTaskAction } from "@/app/actions/tasks";
import { toast } from "sonner";
import type { TaskWithSubject } from "@/types/database";
import {
  CircleDot,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Loader2,
  type LucideIcon,
} from "lucide-react";

const COLUMNS: {
  key: "pending" | "in_progress" | "done";
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}[] = [
  { key: "pending",     label: "Pendente",     icon: CircleDot,    color: "var(--info)",    bgColor: "var(--info-light)" },
  { key: "in_progress", label: "Em andamento", icon: Clock,        color: "var(--warning)", bgColor: "var(--warning-light)" },
  { key: "done",        label: "Concluída",    icon: CheckCircle2, color: "var(--accent)",  bgColor: "var(--accent-light)" },
];

const PRIORITY_COLORS = {
  high:   { bg: "var(--danger-light)",  text: "var(--danger)",  label: "Alta" },
  medium: { bg: "var(--warning-light)", text: "var(--warning)", label: "Média" },
  low:    { bg: "var(--info-light)",    text: "var(--info)",    label: "Baixa" },
};

function isUrgent(dueDate: string | null, status: string) {
  if (!dueDate || status === "done") return false;
  return (new Date(dueDate).getTime() - Date.now()) / 86400000 <= 2;
}

function TaskCard({ task }: { task: TaskWithSubject }) {
  const [isPending, startTransition] = useTransition();
  const priority = PRIORITY_COLORS[task.priority];
  const urgent = isUrgent(task.due_date, task.status);

  const handleStatusChange = (newStatus: "pending" | "in_progress" | "done") => {
    startTransition(async () => {
      const result = await updateTaskStatusAction({ id: task.id, status: newStatus });
      if (result.error) toast.error(result.error);
    });
  };

  const handleDelete = () => {
    if (!confirm(`Excluir "${task.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteTaskAction(task.id);
      if (result.error) toast.error(result.error);
      else toast.success("Tarefa excluída com sucesso");
    });
  };

  return (
    <>
      <style>{`
        .task-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px;
          transition: box-shadow var(--transition), transform var(--transition), border-color var(--transition);
        }
        .task-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--border-strong);
          transform: translateY(-1px);
        }
        .task-card.urgent { border-left: 3px solid var(--danger); }
        .task-header { display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px; }
        .task-title { font-size:14px;font-weight:600;color:var(--text-primary);line-height:1.3; }
        .task-meta { display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px; }
        .task-subject {
          display:inline-flex;align-items:center;gap:5px;
          font-size:11px;color:var(--text-muted);font-weight:500;
        }
        .task-subject-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
        .task-due { font-size:11px; display:inline-flex; align-items:center; gap:3px; }
        .task-due.overdue { color:var(--danger); font-weight:600; }
        .task-due.soon { color:var(--warning); font-weight:600; }
        .task-due.normal { color:var(--text-muted); }
        .task-actions { display:flex;gap:4px;flex-shrink:0; }
        .task-status-select {
          font-size:12px;padding:4px 8px;border-radius:var(--radius-sm);
          border:1px solid var(--border);background:var(--surface-2);
          color:var(--text-secondary);cursor:pointer;font-family:inherit;
          width:100%;
        }
        .task-status-select:focus { border-color:var(--primary); outline:none; }
      `}</style>

      <div className={`task-card ${urgent ? "urgent" : ""} animate-fade-in`}>
        <div className="task-header">
          <h3 className="task-title">{task.title}</h3>
          <div className="task-actions">
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--danger)", padding: "3px 6px" }}
              onClick={handleDelete}
              disabled={isPending}
              aria-label="Excluir tarefa"
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        </div>

        <div className="task-meta">
          {task.subjects && (
            <span className="task-subject">
              <span className="task-subject-dot" style={{ background: task.subjects.color }} />
              {task.subjects.name}
            </span>
          )}

          <span
            style={{
              fontSize: 11, padding: "1px 7px", borderRadius: 99,
              background: priority.bg, color: priority.text, fontWeight: 600,
            }}
          >
            {priority.label}
          </span>

          {task.due_date && (() => {
            const daysLeft = (new Date(task.due_date).getTime() - Date.now()) / 86400000;
            const cls = daysLeft < 0 ? "overdue" : daysLeft <= 2 ? "soon" : "normal";
            const label = daysLeft < 0 ? "Atrasada" :
              daysLeft <= 1 ? "Vence hoje" :
              daysLeft <= 2 ? "Amanhã" :
              new Date(task.due_date).toLocaleDateString("pt-BR");
            return (
              <span className={`task-due ${cls}`}>
                {daysLeft < 0 && <AlertTriangle size={12} />}
                {label}
              </span>
            );
          })()}
        </div>

        {task.description && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.5 }}>
            {task.description}
          </p>
        )}

        <select
          className="task-status-select"
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value as "pending" | "in_progress" | "done")}
          disabled={isPending}
          aria-label="Alterar status"
        >
          <option value="pending">Pendente</option>
          <option value="in_progress">Em andamento</option>
          <option value="done">Concluída</option>
        </select>
      </div>
    </>
  );
}

interface TasksBoardProps {
  pending: TaskWithSubject[];
  inProgress: TaskWithSubject[];
  done: TaskWithSubject[];
}

export function TasksBoard({ pending, inProgress, done }: TasksBoardProps) {
  const columns = [
    { ...COLUMNS[0], tasks: pending },
    { ...COLUMNS[1], tasks: inProgress },
    { ...COLUMNS[2], tasks: done },
  ];

  return (
    <>
      <style>{`
        .kanban {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .kanban { grid-template-columns: 1fr; }
        }
        .kanban-col {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 14px;
          min-height: 220px;
        }
        .kanban-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }
        .kanban-col-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .kanban-col-icon-wrapper {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kanban-col-count {
          font-size: 11px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 1px 8px;
          color: var(--text-muted);
          font-weight: 600;
        }
        .kanban-tasks {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .kanban-empty {
          text-align: center;
          padding: 32px 16px;
          font-size: 13px;
          color: var(--text-muted);
        }
      `}</style>

      <div className="kanban" aria-label="Quadro Kanban de tarefas">
        {columns.map((col) => {
          const Icon = col.icon;
          return (
            <div key={col.key} className="kanban-col">
              <div className="kanban-col-header">
                <span className="kanban-col-title">
                  <div className="kanban-col-icon-wrapper" style={{ background: col.bgColor, color: col.color }}>
                    <Icon size={14} />
                  </div>
                  {col.label}
                </span>
                <span className="kanban-col-count">{col.tasks.length}</span>
              </div>
              <div className="kanban-tasks">
                {col.tasks.length === 0 ? (
                  <div className="kanban-empty">Nenhuma tarefa</div>
                ) : (
                  col.tasks.map((task) => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
