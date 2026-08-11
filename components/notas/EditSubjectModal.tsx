"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { updateSubjectWithEvaluationsAction, type EvaluationItemInput } from "@/app/actions/grades";
import { toast } from "sonner";
import type { SubjectWithStats } from "@/types/database";
import {
  Edit3,
  X,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  Sparkles,
  BookOpen,
} from "lucide-react";

const PALETTE_COLORS = [
  "#1d4ed8",
  "#059669",
  "#0284c7",
  "#7c3aed",
  "#d97706",
  "#0d9488",
  "#db2777",
];

interface EditSubjectModalProps {
  subject: SubjectWithStats;
  initialEvaluations?: Array<{
    id: string;
    title: string;
    value: number;
    weight: number;
    exam_date?: string | null;
  }>;
}

export function EditSubjectModal({ subject, initialEvaluations = [] }: EditSubjectModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [name, setName] = useState(subject.name);
  const [professor, setProfessor] = useState(subject.professor || "");
  const [maxAbsences, setMaxAbsences] = useState(subject.max_absences || 15);
  const [color, setColor] = useState(subject.color || "#1d4ed8");

  // Avaliações (% da nota)
  const [evaluations, setEvaluations] = useState<EvaluationItemInput[]>(
    initialEvaluations.length > 0
      ? initialEvaluations.map((ev) => ({
          id: ev.id,
          title: ev.title,
          value: ev.value,
          weight: ev.weight > 1 ? ev.weight : Math.round(ev.weight * 100),
          exam_date: ev.exam_date || "",
        }))
      : [
          { title: "Prova 1", weight: 30, value: 0, exam_date: "" },
          { title: "Prova 2", weight: 35, value: 0, exam_date: "" },
          { title: "Trabalho Prático", weight: 35, value: 0, exam_date: "" },
        ]
  );

  const addEvaluationRow = () => {
    setEvaluations((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, title: `Avaliação #${prev.length + 1}`, weight: 20, value: 0, exam_date: "" },
    ]);
  };

  const removeEvaluationRow = (idx: number) => {
    setEvaluations((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateEvaluationField = (idx: number, field: keyof EvaluationItemInput, val: any) => {
    setEvaluations((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  // Cálculo da soma das porcentagens
  const totalPercentage = evaluations.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Informe o nome da matéria.");

    startTransition(async () => {
      const result = await updateSubjectWithEvaluationsAction({
        subjectId: subject.id,
        name: name.trim(),
        professor: professor.trim() || undefined,
        max_absences: Number(maxAbsences) || 15,
        color,
        evaluations,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Matéria e divisão de notas de ${name} atualizadas!`);
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
          maxWidth: 600,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
          animation: "scale-in 0.2s ease",
        }}
        role="dialog"
        aria-modal
        aria-label="Editar Matéria e Divisão de Notas"
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: color,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>
                Editar {subject.name}
              </h2>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Ajuste os dados da matéria e a divisão das notas (% e datas)
              </p>
            </div>
          </div>

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
          {/* 1. Dados Básicos da Matéria */}
          <div
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: 16,
              marginBottom: 18,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label className="label">Nome da Matéria *</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cálculo I"
                  required
                />
              </div>
              <div>
                <label className="label">Professor</label>
                <input
                  className="input"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  placeholder="Nome do professor"
                />
              </div>
              <div>
                <label className="label">Máx. Faltas</label>
                <input
                  type="number"
                  className="input"
                  value={maxAbsences}
                  onChange={(e) => setMaxAbsences(Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Cor:</span>
              <div style={{ display: "flex", gap: 6 }}>
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: c,
                      border: color === c ? "2px solid var(--text-primary)" : "none",
                      cursor: "pointer",
                    }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 2. Divisão de Avaliações (% e Datas) */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={15} className="text-primary" />
                Divisão de Notas ({totalPercentage}% de 100%)
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addEvaluationRow}
                style={{ fontSize: 11 }}
              >
                <Plus size={13} />
                + Adicionar Prova
              </button>
            </div>

            {totalPercentage !== 100 && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: totalPercentage > 100 ? "var(--danger)" : "var(--warning)",
                  marginBottom: 10,
                }}
              >
                ⚠️ A soma atual é {totalPercentage}%. Ajuste os valores para totalizar 100%.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {evaluations.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1.5fr 24px",
                    gap: 8,
                    alignItems: "center",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 12px",
                  }}
                >
                  <div>
                    <label className="label" style={{ fontSize: 10 }}>Título da Prova</label>
                    <input
                      className="input"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      value={item.title}
                      onChange={(e) => updateEvaluationField(idx, "title", e.target.value)}
                      placeholder="Ex: Prova 1"
                      required
                    />
                  </div>

                  <div>
                    <label className="label" style={{ fontSize: 10 }}>Valor (%)</label>
                    <input
                      type="number"
                      className="input"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      value={item.weight}
                      onChange={(e) => updateEvaluationField(idx, "weight", Number(e.target.value))}
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <label className="label" style={{ fontSize: 10 }}>Nota (0-10)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      className="input"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      value={item.value ?? 0}
                      onChange={(e) => updateEvaluationField(idx, "value", Number(e.target.value))}
                      placeholder="7.5"
                    />
                  </div>

                  <div>
                    <label className="label" style={{ fontSize: 10 }}>Data da Prova</label>
                    <input
                      type="date"
                      className="input"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      value={item.exam_date || ""}
                      onChange={(e) => updateEvaluationField(idx, "exam_date", e.target.value)}
                    />
                  </div>

                  {evaluations.length > 1 && (
                    <button
                      type="button"
                      style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", marginTop: 14 }}
                      onClick={() => removeEvaluationRow(idx)}
                      title="Remover avaliação"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={12} className="text-primary" />
              As datas informadas acima serão automaticamente inseridas no seu Calendário.
            </p>
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => setOpen(true)}
        title="Editar matéria e divisão de notas"
        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px" }}
      >
        <Edit3 size={14} />
        Editar
      </button>

      {mounted && modalMarkup ? createPortal(modalMarkup, document.body) : null}
    </>
  );
}
