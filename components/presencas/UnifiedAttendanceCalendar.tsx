"use client";

import { useState, useTransition } from "react";
import { upsertAttendanceAction, deleteAttendanceAction } from "@/app/actions/attendance";
import { toast } from "sonner";
import type { Attendance, Subject } from "@/types/database";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Minus,
  Calendar as CalendarIcon,
  Filter,
  Layers,
  BookOpen,
} from "lucide-react";

interface ScheduleItemRef {
  subject_id: string;
  weekday: number;
}

interface UnifiedAttendanceCalendarProps {
  subjects: Pick<Subject, "id" | "name" | "color" | "max_absences">[];
  records: Attendance[];
  schedule?: ScheduleItemRef[];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export function UnifiedAttendanceCalendar({
  subjects,
  records: initialRecords,
  schedule = [],
}: UnifiedAttendanceCalendarProps) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [records, setRecords] = useState<Attendance[]>(initialRecords);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const [showOnlyTodayClasses, setShowOnlyTodayClasses] = useState(true);

  const [isPending, startTransition] = useTransition();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const days = getCalendarDays(year, month);

  // Mapear registros por data YYYY-MM-DD
  const dateRecordsMap = new Map<string, Attendance[]>();
  records.forEach((r) => {
    const list = dateRecordsMap.get(r.date) || [];
    list.push(r);
    dateRecordsMap.set(r.date, list);
  });

  // Registros da data selecionada
  const activeDate = selectedDate || todayStr;
  const activeDateObj = new Date(activeDate + "T00:00:00");
  const activeWeekday = activeDateObj.getDay(); // 0=Dom, 1=Seg,...,6=Sáb
  const activeDateRecords = dateRecordsMap.get(activeDate) || [];

  // Matérias agendadas para o dia da semana selecionado
  const scheduledSubjectIds = new Set(
    schedule.filter((s) => s.weekday === activeWeekday).map((s) => s.subject_id)
  );

  // Filtragem das matérias a serem exibidas no painel lateral
  const displayedSubjects = subjects.filter((sub) => {
    if (!showOnlyTodayClasses) return true; // Se o filtro estiver desativado, mostra todas
    // Se o filtro estiver ativo: mostra se tem aula na grade do dia OU se já existe um registro salvo nesta data
    const isScheduledToday = scheduledSubjectIds.has(sub.id);
    const hasRecordToday = activeDateRecords.some((r) => r.subject_id === sub.id);
    return isScheduledToday || hasRecordToday;
  });

  // Marcar status de um elemento (Fui, Não fui, Sem chamada, Limpar)
  const handleMarkStatus = (
    subjectId: string,
    subjectName: string,
    statusType: "fui" | "nao_fui" | "sem_chamada" | "limpar"
  ) => {
    const existing = activeDateRecords.find((r) => r.subject_id === subjectId);

    if (statusType === "limpar") {
      if (!existing) return;
      setRecords((prev) => prev.filter((r) => r.id !== existing.id));

      startTransition(async () => {
        const result = await deleteAttendanceAction(existing.id, subjectId);
        if (result.error) toast.error(result.error);
        else toast.info(`Registro de ${subjectName} removido.`);
      });
      return;
    }

    const isPresent = statusType === "fui" || statusType === "sem_chamada";
    const notesValue = statusType === "sem_chamada" ? "sem_chamada" : null;

    // Atualização Otimista local
    const updatedRecord: Attendance = {
      id: existing ? existing.id : `temp-${Math.random().toString(36).substring(2, 9)}`,
      user_id: "",
      subject_id: subjectId,
      date: activeDate,
      present: isPresent,
      notes: notesValue,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setRecords((prev) => {
      const filtered = prev.filter((r) => !(r.subject_id === subjectId && r.date === activeDate));
      return [...filtered, updatedRecord];
    });

    startTransition(async () => {
      const result = await upsertAttendanceAction({
        subject_id: subjectId,
        date: activeDate,
        present: isPresent,
        notes: notesValue || "",
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        const statusText =
          statusType === "fui"
            ? "Presença (Fui)"
            : statusType === "nao_fui"
            ? "Falta (Não fui)"
            : "Sem chamada";
        toast.success(`${subjectName}: ${statusText} em ${activeDateObj.toLocaleDateString("pt-BR")}`);
      }
    });
  };

  return (
    <>
      <style>{`
        .unified-att-wrapper {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 20px;
          align-items: start;
          margin-bottom: 28px;
        }
        @media (max-width: 1024px) {
          .unified-att-wrapper { grid-template-columns: 1fr; }
        }
        .cal-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }
        .cal-box-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .cal-box-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .cal-box-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .cal-box-weekday {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          padding: 6px 0;
          text-transform: uppercase;
        }
        .cal-box-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 6px 4px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid transparent;
          background: var(--surface-2);
          color: var(--text-primary);
          transition: all var(--transition);
          position: relative;
        }
        .cal-box-day:hover:not(.empty) {
          border-color: var(--primary);
          transform: scale(1.04);
        }
        .cal-box-day.empty { background: transparent; cursor: default; }
        .cal-box-day.today {
          outline: 2px solid var(--primary);
          outline-offset: 1px;
          font-weight: 800;
        }
        .cal-box-day.selected {
          border-color: var(--primary);
          background: var(--primary-light);
        }
        .cal-day-dots {
          display: flex;
          gap: 3px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .cal-day-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        /* Painel Lateral da Data Selecionada */
        .day-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }
        .day-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .day-panel-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-toggle-btn {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all var(--transition);
        }
        .filter-toggle-btn.active {
          background: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary);
        }

        .subject-mark-row {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-left: 3.5px solid;
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          margin-bottom: 10px;
        }
        .subject-mark-header {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .status-segmented {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }
        .status-segmented-btn {
          padding: 6px 4px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all var(--transition);
        }
        .status-segmented-btn:hover {
          border-color: var(--border-strong);
        }
        .status-segmented-btn.fui-active {
          background: var(--accent-light);
          color: var(--accent);
          border-color: var(--accent);
        }
        .status-segmented-btn.naofui-active {
          background: var(--danger-light);
          color: var(--danger);
          border-color: var(--danger);
        }
        .status-segmented-btn.semchamada-active {
          background: var(--warning-light);
          color: var(--warning);
          border-color: var(--warning);
        }
      `}</style>

      <div className="unified-att-wrapper">
        {/* Lado Esquerdo: Calendário Único Unificado */}
        <div className="cal-box">
          <div className="cal-box-header">
            <h2 className="cal-box-title">
              Calendário Unificado — {MONTHS[month]} {year}
            </h2>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={prevMonth}
                aria-label="Mês anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={nextMonth}
                aria-label="Próximo mês"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="cal-box-grid" role="grid">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="cal-box-weekday">
                {wd}
              </div>
            ))}
            {days.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="cal-box-day empty" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayRecs = dateRecordsMap.get(dateStr) || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === activeDate;

              return (
                <button
                  key={day}
                  className={`cal-box-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedDate(dateStr)}
                  aria-label={`${day} de ${MONTHS[month]} — ${dayRecs.length} registros`}
                >
                  <span>{day}</span>
                  {dayRecs.length > 0 && (
                    <div className="cal-day-dots">
                      {dayRecs.slice(0, 4).map((r) => {
                        const sub = subjects.find((s) => s.id === r.subject_id);
                        const dotColor =
                          r.notes === "sem_chamada"
                            ? "var(--warning)"
                            : r.present
                            ? "var(--accent)"
                            : "var(--danger)";
                        return (
                          <div
                            key={r.id}
                            className="cal-day-dot"
                            style={{ background: dotColor }}
                            title={`${sub?.name || "Matéria"}: ${r.notes === "sem_chamada" ? "Sem chamada" : r.present ? "Fui" : "Não fui"}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lado Direito: Marcar Chamada Apenas das Aulas do Dia */}
        <div className="day-panel">
          <div className="day-panel-header">
            <div className="day-panel-title">
              <span>
                {activeDateObj.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              {activeDate === todayStr && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "var(--primary)",
                    color: "white",
                    textTransform: "uppercase",
                  }}
                >
                  Hoje
                </span>
              )}
            </div>

            {/* Alternar Filtro: Aulas do Dia vs Todas as Matérias */}
            <button
              type="button"
              className={`filter-toggle-btn ${showOnlyTodayClasses ? "active" : ""}`}
              onClick={() => setShowOnlyTodayClasses((prev) => !prev)}
              title={showOnlyTodayClasses ? "Exibindo apenas matérias com aula no dia. Clique para ver todas." : "Exibindo todas as matérias. Clique para filtrar apenas as do dia."}
            >
              <Filter size={12} />
              {showOnlyTodayClasses ? "Aulas do Dia" : "Todas Matérias"}
            </button>
          </div>

          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
            {showOnlyTodayClasses
              ? `Matérias com aula na ${WEEKDAYS[activeWeekday]}-feira:`
              : "Todas as matérias cadastradas:"}
          </p>

          {displayedSubjects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
              <BookOpen size={24} style={{ opacity: 0.5, marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                Sem aulas previstas na grade para este dia.
              </p>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 8, fontSize: 11 }}
                onClick={() => setShowOnlyTodayClasses(false)}
              >
                Ver todas as matérias
              </button>
            </div>
          ) : (
            displayedSubjects.map((sub) => {
              const record = activeDateRecords.find((r) => r.subject_id === sub.id);
              const isFui = record && record.present && record.notes !== "sem_chamada";
              const isNaoFui = record && !record.present;
              const isSemChamada = record && record.notes === "sem_chamada";
              const isScheduled = scheduledSubjectIds.has(sub.id);

              return (
                <div
                  key={sub.id}
                  className="subject-mark-row"
                  style={{ borderLeftColor: sub.color }}
                >
                  <div className="subject-mark-header" style={{ color: sub.color }}>
                    <span>{sub.name}</span>
                    {isScheduled && (
                      <span
                        style={{
                          fontSize: 9,
                          padding: "1px 5px",
                          borderRadius: 3,
                          background: "var(--surface)",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        Aula na grade
                      </span>
                    )}
                  </div>

                  <div className="status-segmented">
                    <button
                      type="button"
                      className={`status-segmented-btn ${isFui ? "fui-active" : ""}`}
                      onClick={() =>
                        handleMarkStatus(sub.id, sub.name, isFui ? "limpar" : "fui")
                      }
                      disabled={isPending}
                      title="Marcar que compareceu (Fui)"
                    >
                      <Check size={12} />
                      Fui
                    </button>

                    <button
                      type="button"
                      className={`status-segmented-btn ${isNaoFui ? "naofui-active" : ""}`}
                      onClick={() =>
                        handleMarkStatus(sub.id, sub.name, isNaoFui ? "limpar" : "nao_fui")
                      }
                      disabled={isPending}
                      title="Marcar que faltou (Não fui)"
                    >
                      <X size={12} />
                      Não fui
                    </button>

                    <button
                      type="button"
                      className={`status-segmented-btn ${isSemChamada ? "semchamada-active" : ""}`}
                      onClick={() =>
                        handleMarkStatus(sub.id, sub.name, isSemChamada ? "limpar" : "sem_chamada")
                      }
                      disabled={isPending}
                      title="Marcar que o professor não deu chamada ou a aula não contou"
                    >
                      <Minus size={12} />
                      Sem chamada
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
