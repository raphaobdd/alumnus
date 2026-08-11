"use client";

import { useState, useTransition } from "react";
import type { ImportantDateWithSubject, Subject } from "@/types/database";
import { deleteImportantDateAction } from "@/app/actions/important_dates";
import { AddImportantDateForm } from "./AddImportantDateForm";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  FileText,
  Upload,
  FileCheck,
  Bookmark,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface ImportantDatesCalendarProps {
  importantDates: ImportantDateWithSubject[];
  subjects: Pick<Subject, "id" | "name" | "color">[];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; border: string; icon: typeof FileText }
> = {
  prova: {
    label: "Prova",
    bg: "var(--danger-light)",
    color: "var(--danger)",
    border: "var(--danger)",
    icon: FileText,
  },
  entrega: {
    label: "Entrega",
    bg: "var(--accent-light)",
    color: "var(--accent)",
    border: "var(--accent)",
    icon: Upload,
  },
  evento: {
    label: "Evento",
    bg: "var(--primary-light)",
    color: "var(--primary)",
    border: "var(--primary)",
    icon: CalendarIcon,
  },
  administrativo: {
    label: "Administrativo",
    bg: "var(--warning-light)",
    color: "var(--warning)",
    border: "var(--warning)",
    icon: FileCheck,
  },
  outro: {
    label: "Outro",
    bg: "var(--surface-2)",
    color: "var(--text-secondary)",
    border: "var(--border-strong)",
    icon: Bookmark,
  },
};

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export function ImportantDatesCalendar({
  importantDates,
  subjects,
}: ImportantDatesCalendarProps) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [editingItem, setEditingItem] = useState<ImportantDateWithSubject | null>(null);

  const [isPending, startTransition] = useTransition();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Filtragem por categoria
  const filteredDates = importantDates.filter((d) =>
    selectedCategory === "all" ? true : d.category === selectedCategory
  );

  // Mapa de eventos por data "YYYY-MM-DD"
  const datesMap = new Map<string, ImportantDateWithSubject[]>();
  filteredDates.forEach((d) => {
    const arr = datesMap.get(d.event_date) || [];
    arr.push(d);
    datesMap.set(d.event_date, arr);
  });

  const days = getCalendarDays(year, month);

  // Eventos do dia selecionado
  const selectedDayEvents = datesMap.get(selectedDay) || [];

  // Próximos 7 dias de destaques
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const upcomingSevenDaysEvents = importantDates
    .filter((d) => {
      const eventMs = new Date(d.event_date + "T00:00:00").getTime();
      const diff = eventMs - new Date(todayStr + "T00:00:00").getTime();
      return diff >= 0 && diff <= sevenDaysMs;
    })
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Excluir "${title}" do calendário?`)) return;
    startTransition(async () => {
      const result = await deleteImportantDateAction(id);
      if (result.error) toast.error(result.error);
      else toast.success("Data excluída com sucesso");
    });
  };

  return (
    <>
      <style>{`
        .cal-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .cal-layout { grid-template-columns: 1fr; }
        }
        .cal-filter-bar {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          margin-bottom: 16px;
        }
        .cal-filter-btn {
          padding: 5px 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition);
        }
        .cal-filter-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .cal-filter-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .cal-grid-wrapper {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
        }
        .cal-grid-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .cal-month-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .cal-nav-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition), color var(--transition);
        }
        .cal-nav-btn:hover { background: var(--border); color: var(--text-primary); }
        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .cal-weekday {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          padding: 6px 0;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .cal-cell {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 6px 4px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1.5px solid transparent;
          background: var(--surface-2);
          color: var(--text-primary);
          transition: all var(--transition);
          position: relative;
        }
        .cal-cell:hover:not(.empty) {
          border-color: var(--primary);
          transform: scale(1.03);
        }
        .cal-cell.empty { background: transparent; cursor: default; }
        .cal-cell.today {
          outline: 2px solid var(--primary);
          outline-offset: 1px;
          font-weight: 700;
        }
        .cal-cell.selected {
          border-color: var(--primary);
          background: var(--primary-light);
        }
        .cal-dots {
          display: flex;
          gap: 3px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .cal-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        /* Sidebar direita: Detalhes do Dia & Próximos 7 Dias */
        .cal-sidebar-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px;
          margin-bottom: 16px;
        }
        .cal-sidebar-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .event-item {
          padding: 12px;
          border-radius: var(--radius-sm);
          border-left: 3.5px solid;
          background: var(--surface-2);
          margin-bottom: 8px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          transition: transform var(--transition);
        }
        .event-item:hover { transform: translateX(2px); }
        .event-title { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
        .event-sub { font-size: 11px; color: var(--text-muted); }
        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
      `}</style>

      {/* Modal de Edição */}
      {editingItem && (
        <AddImportantDateForm
          subjects={subjects}
          initialData={editingItem}
          onCancel={() => setEditingItem(null)}
          onSuccess={() => setEditingItem(null)}
        />
      )}

      {/* Barra de Filtros por Categoria */}
      <div className="cal-filter-bar">
        <button
          className={`cal-filter-btn ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          Todas as categorias
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            className={`cal-filter-btn ${selectedCategory === key ? "active" : ""}`}
            onClick={() => setSelectedCategory(key)}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="cal-layout">
        {/* Lado Esquerdo: Calendário Mensal */}
        <div className="cal-grid-wrapper">
          <div className="cal-grid-header">
            <h2 className="cal-month-title">{MONTHS[month]} {year}</h2>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="cal-nav-btn" onClick={prevMonth} aria-label="Mês anterior">
                <ChevronLeft size={18} />
              </button>
              <button className="cal-nav-btn" onClick={nextMonth} aria-label="Próximo mês">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="cal-grid" role="grid">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="cal-weekday">{wd}</div>
            ))}
            {days.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="cal-cell empty" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = datesMap.get(dateStr) || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;

              return (
                <button
                  key={day}
                  className={`cal-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedDay(dateStr)}
                  aria-label={`${day} de ${MONTHS[month]} - ${dayEvents.length} eventos`}
                >
                  <span>{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="cal-dots">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const cfg = CATEGORY_CONFIG[ev.category] || CATEGORY_CONFIG.outro;
                        return (
                          <div
                            key={ev.id}
                            className="cal-dot"
                            style={{ background: cfg.color }}
                            title={ev.title}
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

        {/* Lado Direito: Detalhes do Dia & Destaques dos Próximos 7 Dias */}
        <div>
          {/* Painel do Dia Selecionado */}
          <div className="cal-sidebar-card">
            <div className="cal-sidebar-title">
              <span>
                {new Date(selectedDay + "T00:00:00").toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              <AddImportantDateForm subjects={subjects} defaultDate={selectedDay} />
            </div>

            {selectedDayEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
                Nenhum evento registrado para este dia.
              </p>
            ) : (
              selectedDayEvents.map((ev) => {
                const cfg = CATEGORY_CONFIG[ev.category] || CATEGORY_CONFIG.outro;
                const CatIcon = cfg.icon;
                return (
                  <div key={ev.id} className="event-item" style={{ borderLeftColor: cfg.color }}>
                    <div style={{ flex: 1 }}>
                      <div className="event-title">{ev.title}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                        <span className="category-badge" style={{ background: cfg.bg, color: cfg.color }}>
                          <CatIcon size={10} />
                          {cfg.label}
                        </span>
                        {ev.subjects && (
                          <span className="event-sub" style={{ color: ev.subjects.color, fontWeight: 600 }}>
                            {ev.subjects.name}
                          </span>
                        )}
                      </div>
                      {ev.description && (
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                          {ev.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 4 }}
                        onClick={() => setEditingItem(ev)}
                        aria-label="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 4, color: "var(--danger)" }}
                        onClick={() => handleDelete(ev.id, ev.title)}
                        disabled={isPending}
                        aria-label="Excluir"
                      >
                        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Painel: Próximos 7 Dias */}
          <div className="cal-sidebar-card">
            <div className="cal-sidebar-title" style={{ fontSize: 14 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={15} style={{ color: "var(--warning)" }} />
                Próximos 7 Dias
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                {upcomingSevenDaysEvents.length} evento(s)
              </span>
            </div>

            {upcomingSevenDaysEvents.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>
                Sem datas críticas nos próximos 7 dias.
              </p>
            ) : (
              upcomingSevenDaysEvents.map((ev) => {
                const cfg = CATEGORY_CONFIG[ev.category] || CATEGORY_CONFIG.outro;
                const dateFormatted = new Date(ev.event_date + "T00:00:00").toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                });
                return (
                  <div
                    key={ev.id}
                    className="event-item"
                    style={{ borderLeftColor: cfg.color, cursor: "pointer" }}
                    onClick={() => setSelectedDay(ev.event_date)}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="event-title">{ev.title}</div>
                      <div className="event-sub">
                        {dateFormatted} {ev.subjects ? `· ${ev.subjects.name}` : ""}
                      </div>
                    </div>
                    <span className="category-badge" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
