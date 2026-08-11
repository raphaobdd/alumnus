"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { scheduleSchema, WEEKDAY_LABELS } from "@/lib/validations/schedule";
import { createScheduleAction, updateScheduleAction } from "@/app/actions/schedule";
import { toast } from "sonner";
import type { z } from "zod";
import type { Subject, ScheduleWithSubject } from "@/types/database";
import { Plus, Loader2, X } from "lucide-react";

type ScheduleFormValues = z.input<typeof scheduleSchema>;

interface AddScheduleFormProps {
  subjects: Pick<Subject, "id" | "name" | "color">[];
  initialData?: ScheduleWithSubject | null;
  initialWeekday?: number;
  initialStartTime?: string;
  initialEndTime?: string;
  onClose?: () => void;
}

export function AddScheduleForm({
  subjects,
  initialData,
  initialWeekday,
  initialStartTime,
  initialEndTime,
  onClose,
}: AddScheduleFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEditing = !!initialData;
  const isOpen = open || isEditing || initialWeekday !== undefined;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      weekday: initialData?.weekday ?? initialWeekday ?? 1,
      subject_name: initialData?.subjects.name || "",
      start_time: initialData?.start_time.slice(0, 5) || initialStartTime || "08:00",
      end_time: initialData?.end_time.slice(0, 5) || initialEndTime || "09:00",
      room: initialData?.room || "",
    },
  });

  useEffect(() => {
    if (initialData || initialWeekday !== undefined) {
      reset({
        weekday: initialData?.weekday ?? initialWeekday ?? 1,
        subject_name: initialData?.subjects.name || "",
        start_time: initialData?.start_time.slice(0, 5) || initialStartTime || "08:00",
        end_time: initialData?.end_time.slice(0, 5) || initialEndTime || "09:00",
        room: initialData?.room || "",
      });
    }
  }, [initialData, initialWeekday, initialStartTime, initialEndTime, reset]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  const onSubmit = (data: ScheduleFormValues) => {
    startTransition(async () => {
      const payload = {
        ...data,
        weekday: Number(data.weekday),
      };

      const result = isEditing
        ? await updateScheduleAction(initialData.id, payload)
        : await createScheduleAction(payload);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Aula atualizada com sucesso!" : "Aula adicionada com sucesso!");
        reset();
        setOpen(false);
        if (onClose) onClose();
      }
    });
  };

  if (!isOpen) {
    return (
      <button id="add-schedule-btn" className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        Adicionar aula
      </button>
    );
  }

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
          maxWidth: 420,
          boxShadow: "var(--shadow-lg)",
          animation: "scale-in 0.2s ease",
        }}
        role="dialog"
        aria-modal
        aria-label={isEditing ? "Editar aula" : "Adicionar aula"}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            {isEditing ? "Editar aula" : "Adicionar aula"}
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
          {/* Matéria Digitada com Sugestões Autocomplete */}
          <div style={{ marginBottom: 14 }}>
            <label className="label" htmlFor="sched-subject-input">Matéria *</label>
            <input
              id="sched-subject-input"
              className="input"
              list="subjects-datalist"
              placeholder="Digite o nome da matéria (ex: Cálculo I, Física)..."
              {...register("subject_name")}
            />
            <datalist id="subjects-datalist">
              {subjects.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
            {errors.subject_name && <p className="error-message">{errors.subject_name.message}</p>}

            {/* Pílulas de Seleção Rápida de Matérias Existentes */}
            {subjects.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {subjects.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 12,
                      border: `1px solid ${s.color}`,
                      color: s.color,
                      background: "transparent",
                      cursor: "pointer",
                    }}
                    onClick={() => setValue("subject_name", s.name)}
                  >
                    + {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="label" htmlFor="sched-weekday">Dia da semana *</label>
            <select id="sched-weekday" className="input" {...register("weekday", { valueAsNumber: true })}>
              {WEEKDAY_LABELS.map((label, idx) => (
                <option key={idx} value={idx}>{label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label className="label" htmlFor="sched-start">Início *</label>
              <input id="sched-start" type="time" className="input" {...register("start_time")} />
              {errors.start_time && <p className="error-message">{errors.start_time.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="sched-end">Fim *</label>
              <input id="sched-end" type="time" className="input" {...register("end_time")} />
              {errors.end_time && <p className="error-message">{errors.end_time.message}</p>}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label" htmlFor="sched-room">Sala</label>
            <input id="sched-room" className="input" placeholder="Ex: Sala 201" {...register("room")} />
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleClose}>Cancelar</button>
            <button id="add-schedule-submit" type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : isEditing ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
