"use client";

import { useState, useTransition } from "react";
import { upsertAttendanceAction } from "@/app/actions/attendance";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

interface QuickAttendanceButtonsProps {
  subjectId: string;
  subjectName: string;
  initialPresences: number;
  initialAbsences: number;
}

export function QuickAttendanceButtons({
  subjectId,
  subjectName,
  initialPresences,
  initialAbsences,
}: QuickAttendanceButtonsProps) {
  const [presences, setPresences] = useState(initialPresences);
  const [absences, setAbsences] = useState(initialAbsences);
  const [isPending, startTransition] = useTransition();

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleMark = (e: React.MouseEvent, present: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    // Atualização otimista
    if (present) setPresences((prev) => prev + 1);
    else setAbsences((prev) => prev + 1);

    startTransition(async () => {
      const result = await upsertAttendanceAction({
        subject_id: subjectId,
        date: todayStr,
        present,
      });

      if (result.error) {
        toast.error(result.error);
        // Rollback
        if (present) setPresences((prev) => prev - 1);
        else setAbsences((prev) => prev - 1);
      } else {
        toast.success(
          present
            ? `Presença registrada hoje em ${subjectName}!`
            : `Falta registrada hoje em ${subjectName}!`
        );
      }
    });
  };

  return (
    <div
      style={{ display: "flex", gap: 6, alignItems: "center" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="quick-att-btn present"
        onClick={(e) => handleMark(e, true)}
        disabled={isPending}
        title="Registrar presença hoje"
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        + Presença
      </button>

      <button
        type="button"
        className="quick-att-btn absent"
        onClick={(e) => handleMark(e, false)}
        disabled={isPending}
        title="Registrar falta hoje"
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
        + Falta
      </button>

      <style>{`
        .quick-att-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all var(--transition);
        }
        .quick-att-btn.present {
          background: var(--accent-light);
          color: var(--accent);
          border-color: var(--accent);
        }
        .quick-att-btn.present:hover {
          background: var(--accent);
          color: white;
        }
        .quick-att-btn.absent {
          background: var(--danger-light);
          color: var(--danger);
          border-color: var(--danger);
        }
        .quick-att-btn.absent:hover {
          background: var(--danger);
          color: white;
        }
      `}</style>
    </div>
  );
}
