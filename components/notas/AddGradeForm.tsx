"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gradeSchema } from "@/lib/validations/grades";
import { createGradeAction } from "@/app/actions/grades";
import { toast } from "sonner";
import type { z } from "zod";
import { Plus, Loader2, X, Calendar, Percent } from "lucide-react";

type GradeFormValues = z.input<typeof gradeSchema>;

export function AddGradeForm({ subjectId }: { subjectId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: { subject_id: subjectId, weight: 30 },
  });

  const onSubmit = (data: GradeFormValues) => {
    startTransition(async () => {
      const result = await createGradeAction({ ...data, subject_id: subjectId });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Avaliação salva e sincronizada no calendário!");
        reset({ subject_id: subjectId, weight: 30 });
        setOpen(false);
      }
    });
  };

  if (!open) {
    return (
      <button id="add-grade-btn" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        <Plus size={15} />
        Adicionar avaliação
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
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
          maxWidth: 420,
          boxShadow: "var(--shadow-lg)",
          animation: "scale-in 0.2s ease",
        }}
        role="dialog"
        aria-modal
        aria-label="Adicionar avaliação"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            Adicionar avaliação
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
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: 14 }}>
            <label className="label" htmlFor="grade-title">Título da Avaliação *</label>
            <input
              id="grade-title"
              className="input"
              placeholder="Ex: Prova 1, Trabalho Prático..."
              {...register("title")}
            />
            {errors.title && <p className="error-message">{errors.title.message}</p>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label className="label" htmlFor="grade-value">Nota (0–10) *</label>
              <input
                id="grade-value"
                type="number"
                step="0.1"
                min="0"
                max="10"
                className="input"
                placeholder="7.5"
                {...register("value", { valueAsNumber: true })}
              />
              {errors.value && <p className="error-message">{errors.value.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="grade-weight">Porcentagem (%) *</label>
              <input
                id="grade-weight"
                type="number"
                step="1"
                min="1"
                max="100"
                className="input"
                placeholder="30"
                {...register("weight", { valueAsNumber: true })}
              />
              {errors.weight && <p className="error-message">{errors.weight.message}</p>}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label" htmlFor="grade-date">Data da Avaliação</label>
            <input id="grade-date" type="date" className="input" {...register("exam_date")} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={12} className="text-primary" />
              A data da avaliação é inserida automaticamente no seu Calendário.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button id="add-grade-submit" type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : "Salvar avaliação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
