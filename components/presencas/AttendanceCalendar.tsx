"use client";

import { useState, useTransition } from "react";
import { upsertAttendanceAction, deleteAttendanceAction } from "@/app/actions/attendance";
import { toast } from "sonner";
import type { Attendance } from "@/types/database";
import { ChevronLeft, ChevronRight, Check, X, Calendar as CalendarIcon, Loader2, RotateCcw } from "lucide-react";

interface AttendanceCalendarProps {
  subjectId: string;
  records: Attendance[];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export function AttendanceCalendar({ subjectId, records: initialRecords }: AttendanceCalendarProps) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [records, setRecords] = useState<Attendance[]>(initialRecords);
  const [isPending, startTransition] = useTransition();

  const recordMap = new Map<string, Attendance>();
  records.forEach((r) => recordMap.set(r.date, r));

  const days = getCalendarDays(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Alternância interativa em 3 estados: Presente -> Falta -> Desmarcar
  const handleCycleState = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const existing = recordMap.get(dateStr);

    if (!existing) {
      // Estado 1: Marcar Presente
      const tempItem: Attendance = {
        id: `temp-${Date.now()}`,
        user_id: "",
        subject_id: subjectId,
        date: dateStr,
        present: true,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setRecords((prev) => [...prev, tempItem]);

      startTransition(async () => {
        const result = await upsertAttendanceAction({
          subject_id: subjectId,
          date: dateStr,
          present: true,
        });
        if (result.error) {
          toast.error(result.error);
          setRecords((prev) => prev.filter((r) => r.date !== dateStr));
        } else {
          toast.success(`Presença registrada no dia ${day}/${month + 1}`);
        }
      });
    } else if (existing.present) {
      // Estado 2: Alternar para Falta
      setRecords((prev) =>
        prev.map((r) => (r.date === dateStr ? { ...r, present: false } : r))
      );

      startTransition(async () => {
        const result = await upsertAttendanceAction({
          subject_id: subjectId,
          date: dateStr,
          present: false,
        });
        if (result.error) {
          toast.error(result.error);
          setRecords((prev) =>
            prev.map((r) => (r.date === dateStr ? { ...r, present: true } : r))
          );
        } else {
          toast.error(`Falta registrada no dia ${day}/${month + 1}`);
        }
      });
    } else {
      // Estado 3: Desmarcar/Limpar registro
      setRecords((prev) => prev.filter((r) => r.date !== dateStr));

      startTransition(async () => {
        const result = await deleteAttendanceAction(existing.id, subjectId);
        if (result.error) {
          toast.error(result.error);
          setRecords((prev) => [...prev, existing]);
        } else {
          toast.info(`Registro desmarcado no dia ${day}/${month + 1}`);
        }
      });
    }
  };

  const markToday = (present: boolean) => {
    const todayDay = today.getDate();
    handleCycleState(todayDay);
  };

  return (
    <>
      <style>{`
        .cal-wrapper { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;box-shadow:var(--shadow-sm); }
        .cal-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px; }
        .cal-title { font-size:16px;font-weight:700;color:var(--text-primary); }
        .cal-nav { display:flex;gap:4px; }
        .cal-nav-btn { width:32px;height:32px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--surface-2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);transition:background var(--transition), color var(--transition); }
        .cal-nav-btn:hover { background:var(--border); color:var(--text-primary); }
        .cal-grid { display:grid;grid-template-columns:repeat(7,1fr);gap:6px; }
        .cal-weekday { text-align:center;font-size:11px;font-weight:600;color:var(--text-muted);padding:6px 0;text-transform:uppercase;letter-spacing:.04em; }
        .cal-day {
          aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
          border-radius:var(--radius-sm);font-size:13px;font-weight:600;
          cursor:pointer;border:1.5px solid transparent;transition:all var(--transition);
          position:relative;
        }
        .cal-day:hover:not(.empty) { transform:scale(1.06); box-shadow:var(--shadow-sm); }
        .cal-day.empty { cursor:default; }
        .cal-day.present { background:var(--accent-light);color:var(--accent);border-color:var(--accent); }
        .cal-day.absent { background:var(--danger-light);color:var(--danger);border-color:var(--danger); }
        .cal-day.today { outline:2px solid var(--primary);outline-offset:1px; font-weight:800; }
        .cal-day.unmarked { background:var(--surface-2);color:var(--text-muted); }
        .cal-day.unmarked:hover { background:var(--border); color:var(--text-primary); }
        .cal-legend { display:flex;gap:16px;margin-top:20px;justify-content:center;flex-wrap:wrap; }
        .cal-legend-item { display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);font-weight:500; }
        .cal-legend-dot { width:12px;height:12px;border-radius:3px; }

        .quick-today-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          margin-bottom: 18px;
          gap: 10px;
          flex-wrap: wrap;
        }
      `}</style>

      <div className="cal-wrapper">
        {/* Barra de Ação Rápida para Hoje */}
        <div className="quick-today-bar">
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <CalendarIcon size={16} className="text-primary" />
            Hoje ({today.toLocaleDateString("pt-BR")})
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-accent btn-sm"
              onClick={() => markToday(true)}
              disabled={isPending}
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Marcar Presença
            </button>
            <button
              className="btn btn-danger btn-sm"
              style={{ background: "var(--danger-light)", color: "var(--danger)", border: "1px solid var(--danger)" }}
              onClick={() => markToday(false)}
              disabled={isPending}
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
              Marcar Falta
            </button>
          </div>
        </div>

        <div className="cal-header">
          <h2 className="cal-title">{MONTHS[month]} {year}</h2>
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth} aria-label="Mês anterior">
              <ChevronLeft size={18} />
            </button>
            <button className="cal-nav-btn" onClick={nextMonth} aria-label="Próximo mês">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="cal-grid" role="grid" aria-label="Calendário de presenças">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="cal-weekday" role="columnheader">{wd}</div>
          ))}
          {days.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="cal-day empty" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const record = recordMap.get(dateStr);
            const isToday = dateStr === todayStr;
            const statusClass = record ? (record.present ? "present" : "absent") : "unmarked";

            return (
              <button
                key={day}
                className={`cal-day ${statusClass} ${isToday ? "today" : ""}`}
                onClick={() => handleCycleState(day)}
                disabled={isPending}
                aria-label={`${day}/${month+1}/${year} — ${record ? (record.present ? "Presente" : "Falta") : "Não registrado"}`}
                title={
                  record
                    ? record.present
                      ? "Presente (clique para mudar para Falta)"
                      : "Falta (clique para Limpar registro)"
                    : "Clique para registrar Presente"
                }
              >
                <span>{day}</span>
                {record && (
                  <span style={{ fontSize: 9, marginTop: 2 }}>
                    {record.present ? <Check size={11} /> : <X size={11} />}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="cal-legend">
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }} />
            1 clique: Presente
          </div>
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background: "var(--danger-light)", border: "1px solid var(--danger)" }} />
            2 cliques: Falta
          </div>
          <div className="cal-legend-item">
            <div className="cal-legend-dot" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} />
            3 cliques: Limpar
          </div>
        </div>
      </div>
    </>
  );
}
