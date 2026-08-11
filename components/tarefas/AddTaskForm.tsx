"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { createTaskAction } from "@/app/actions/tasks";
import { toast } from "sonner";
import type { Subject, Grade } from "@/types/database";
import { Plus, Loader2, X, Sparkles } from "lucide-react";

interface AddTaskFormProps {
  subjects: Pick<Subject, "id" | "name" | "color">[];
  grades?: Pick<Grade, "id" | "subject_id" | "title" | "weight">[];
}

export function AddTaskForm({ subjects, grades = [] }: AddTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Matéria selecionada e suas avaliações correspondentes
  const subjectGrades = grades.filter((g) => g.subject_id === subjectId);

  // Recalcular a prioridade 100% AUTOMATICAMENTE quando a data de entrega ou avaliação muda
  const { priority, priorityReason } = useMemo(() => {
    let calculatedPriority: "low" | "medium" | "high" = "low";
    const reasons: string[] = [];

    // 1. Cálculo por Prazo
    if (dueDate) {
      const dueTimestamp = new Date(dueDate).getTime();
      const nowTimestamp = new Date().getTime();
      const diffDays = (dueTimestamp - nowTimestamp) / (1000 * 60 * 60 * 24);

      if (diffDays <= 2) {
        calculatedPriority = "high";
        reasons.push(diffDays < 0 ? "Prazo vencido" : "Entrega em menos de 48h");
      } else if (diffDays <= 7) {
        calculatedPriority = "medium";
        reasons.push("Entrega nesta semana");
      } else {
        reasons.push("Prazo com mais de 7 dias");
      }
    }

    // 2. Cálculo pela Porcentagem da Nota
    if (gradeId) {
      const selectedGrade = grades.find((g) => g.id === gradeId);
      if (selectedGrade) {
        const pct = selectedGrade.weight > 1 ? selectedGrade.weight : Math.round(selectedGrade.weight * 100);
        if (pct >= 30) {
          calculatedPriority = "high";
          reasons.push(`Vale ${pct}% da nota final`);
        } else if (pct >= 15) {
          if (calculatedPriority === "low") calculatedPriority = "medium";
          reasons.push(`Vale ${pct}% da nota final`);
        } else {
          reasons.push(`Vale ${pct}% da nota`);
        }
      }
    }

    return {
      priority: calculatedPriority,
      priorityReason: reasons.length > 0 ? reasons.join(" • ") : "Definida por padrão",
    };
  }, [dueDate, gradeId, grades]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return toast.error("Informe o título da tarefa.");

    // Se houver uma avaliação selecionada, compor no corpo da descrição
    let finalDesc = description.trim();
    if (gradeId) {
      const selectedGrade = grades.find((g) => g.id === gradeId);
      if (selectedGrade) {
        const pct = selectedGrade.weight > 1 ? selectedGrade.weight : Math.round(selectedGrade.weight * 100);
        const tag = `[Avaliação: ${selectedGrade.title} (${pct}% da nota)]`;
        finalDesc = finalDesc ? `${tag}\n${finalDesc}` : tag;
      }
    }

    startTransition(async () => {
      const result = await createTaskAction({
        title: title.trim(),
        description: finalDesc || undefined,
        subject_id: subjectId || undefined,
        due_date: dueDate || undefined,
        status: "pending",
        priority, // Prioridade calculada 100% automaticamente
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Tarefa criada com sucesso!");
        setTitle("");
        setDescription("");
        setSubjectId("");
        setGradeId("");
        setDueDate("");
        setOpen(false);
      }
    });
  };

  const modalMarkup = open ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
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
          maxWidth: 500,
          boxShadow: "var(--shadow-lg)",
          animation: "scale-in 0.2s ease",
        }}
        role="dialog"
        aria-modal
        aria-label="Nova tarefa"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
            Nova Tarefa
          </h2>
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
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="label" htmlFor="task-title">Título da Tarefa *</label>
            <input
              id="task-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Entregar relatório do trabalho"
              required
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label" htmlFor="task-description">Descrição / Instruções</label>
            <textarea
              id="task-description"
              className="input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Matéria e Parte da Nota */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label className="label" htmlFor="task-subject">Matéria</label>
              <select
                id="task-subject"
                className="input"
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setGradeId("");
                }}
              >
                <option value="">Sem matéria</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="task-grade">Parte da Nota (%)</label>
              <select
                id="task-grade"
                className="input"
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                disabled={!subjectId || subjectGrades.length === 0}
              >
                <option value="">
                  {!subjectId
                    ? "Selecione a matéria"
                    : subjectGrades.length === 0
                    ? "Sem avaliações cadastradas"
                    : "Selecione a avaliação..."}
                </option>
                {subjectGrades.map((g) => {
                  const pct = g.weight > 1 ? g.weight : Math.round(g.weight * 100);
                  return (
                    <option key={g.id} value={g.id}>
                      {g.title} ({pct}% da nota)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Prazo e Prioridade Automática (Somente leitura para o usuário) */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label className="label" htmlFor="task-due-date">Prazo de Entrega</label>
              <input
                id="task-due-date"
                type="datetime-local"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Prioridade (Automática)</label>
              <div
                style={{
                  height: 40,
                  borderRadius: "var(--radius-sm)",
                  padding: "0 10px",
                  fontSize: 12,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: priority === "high" ? "var(--danger-light)" : priority === "medium" ? "var(--warning-light)" : "var(--surface-2)",
                  color: priority === "high" ? "var(--danger)" : priority === "medium" ? "var(--warning)" : "var(--text-muted)",
                  border: `1px solid ${priority === "high" ? "var(--danger)" : priority === "medium" ? "var(--warning)" : "var(--border)"}`,
                }}
              >
                {priority === "high" ? "🔥 Alta (Urgente)" : priority === "medium" ? "⚡ Média" : "🌱 Baixa"}
              </div>
            </div>
          </div>

          {/* Sinais do Cálculo de Prioridade */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: priority === "high" ? "var(--danger)" : priority === "medium" ? "var(--warning)" : "var(--text-secondary)",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Sparkles size={14} className="text-primary" />
            <span>Cálculo do sistema: <strong>{priorityReason}</strong></span>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button id="add-task-submit" type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? <><Loader2 size={16} className="animate-spin" /> Criando...</> : "Criar Tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        id="add-task-btn"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <Plus size={16} />
        Nova tarefa
      </button>

      {mounted && modalMarkup ? createPortal(modalMarkup, document.body) : null}
    </>
  );
}
