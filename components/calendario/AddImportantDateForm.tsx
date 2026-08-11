"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { importantDateSchema, type ImportantDateInput } from "@/lib/validations/important_dates";
import { createImportantDateAction, updateImportantDateAction } from "@/app/actions/important_dates";
import { toast } from "sonner";
import type { Subject, ImportantDateWithSubject } from "@/types/database";
import { Plus, Loader2, X, Calendar as CalendarIcon } from "lucide-react";

interface AddImportantDateFormProps {
  subjects: Pick<Subject, "id" | "name" | "color">[];
  initialData?: ImportantDateWithSubject | null;
  defaultDate?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddImportantDateForm({
  subjects,
  initialData,
  defaultDate,
  onSuccess,
  onCancel,
}: AddImportantDateFormProps) {
  const [open, setOpen] = useState(!!initialData);
  const [isPending, startTransition] = useTransition();

  const isEditing = !!initialData;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ImportantDateInput>({
    resolver: zodResolver(importantDateSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      event_date: initialData?.event_date || defaultDate || new Date().toISOString().slice(0, 10),
      category: initialData?.category || "outro",
      subject_id: initialData?.subject_id || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setOpen(true);
      setValue("title", initialData.title);
      setValue("description", initialData.description || "");
      setValue("event_date", initialData.event_date);
      setValue("category", initialData.category);
      setValue("subject_id", initialData.subject_id || "");
    }
  }, [initialData, setValue]);

  const handleClose = () => {
    setOpen(false);
    if (onCancel) onCancel();
  };

  const onSubmit = (data: ImportantDateInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateImportantDateAction(initialData.id, data)
        : await createImportantDateAction(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Data atualizada com sucesso!" : "Data importante registrada!");
        reset();
        setOpen(false);
        if (onSuccess) onSuccess();
      }
    });
  };

  if (!open && !isEditing) {
    return (
      <button id="add-important-date-btn" className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        Nova data importante
      </button>
    );
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
        animation: "fade-in 0.15s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          width: "100%",
          maxWidth: 460,
          boxShadow: "var(--shadow-lg)",
          animation: "scale-in 0.2s ease",
        }}
        role="dialog"
        aria-modal
        aria-label={isEditing ? "Editar data importante" : "Nova data importante"}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarIcon size={18} className="text-primary" />
            {isEditing ? "Editar data importante" : "Nova data importante"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
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
            <label className="label" htmlFor="date-title">Título *</label>
            <input id="date-title" className="input" placeholder="Ex: Prova de Cálculo I, Entrega de TCC..." {...register("title")} />
            {errors.title && <p className="error-message">{errors.title.message}</p>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label className="label" htmlFor="date-event-date">Data do Evento *</label>
              <input id="date-event-date" type="date" className="input" {...register("event_date")} />
              {errors.event_date && <p className="error-message">{errors.event_date.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="date-category">Categoria</label>
              <select id="date-category" className="input" {...register("category")}>
                <option value="prova">Prova / Avaliação</option>
                <option value="entrega">Entrega / Trabalho</option>
                <option value="evento">Evento / Semanário</option>
                <option value="administrativo">Administrativo / Matrícula</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label" htmlFor="date-subject">Matéria associada (opcional)</label>
            <select id="date-subject" className="input" {...register("subject_id")}>
              <option value="">Nenhuma matéria específica</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="label" htmlFor="date-description">Descrição ou Observações</label>
            <textarea
              id="date-description"
              className="input"
              rows={2}
              placeholder="Detalhes opcionais..."
              style={{ resize: "vertical" }}
              {...register("description")}
            />
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleClose}>
              Cancelar
            </button>
            <button id="save-date-submit" type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {isEditing ? "Salvando..." : "Criando..."}
                </>
              ) : (
                isEditing ? "Salvar alterações" : "Criar data"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
