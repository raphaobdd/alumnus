"use client";

import React, { useState, useTransition } from "react";
import { deleteScheduleAction, moveScheduleAction } from "@/app/actions/schedule";
import { AddScheduleForm } from "./AddScheduleForm";
import { toast } from "sonner";
import type { ScheduleWithSubject, Subject } from "@/types/database";
import { WEEKDAY_LABELS } from "@/lib/validations/schedule";
import {
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  Loader2,
  Plus,
  CalendarDays,
  LayoutGrid,
} from "lucide-react";

interface WeeklyGridProps {
  schedule: ScheduleWithSubject[];
  subjects: Pick<Subject, "id" | "name" | "color">[];
}

const WEEKDAYS_ORDER = [0, 1, 2, 3, 4, 5, 6]; // Dom -> Sáb

export function WeeklyGrid({ schedule: initialSchedule, subjects }: WeeklyGridProps) {
  const today = new Date().getDay(); // 0=Dom,...,6=Sáb

  const [prevSchedule, setPrevSchedule] = useState(initialSchedule);
  const [items, setItems] = useState<ScheduleWithSubject[]>(initialSchedule);

  if (prevSchedule !== initialSchedule) {
    setPrevSchedule(initialSchedule);
    setItems(initialSchedule);
  }

  const [selectedWeekday, setSelectedWeekday] = useState<number>(today);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  const [editingItem, setEditingItem] = useState<ScheduleWithSubject | null>(null);
  const [addingForDay, setAddingForDay] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Remover aula de ${name}?`)) return;
    startTransition(async () => {
      const result = await deleteScheduleAction(id);
      if (result.error) toast.error(result.error);
      else toast.success("Aula removida com sucesso");
    });
  };

  // Handlers de Drag & Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setActiveDragId(id);
  };

  const handleDragEnd = () => {
    setActiveDragId(null);
    setDragOverDay(null);
  };

  const handleDragOver = (e: React.DragEvent, weekday: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDay !== weekday) {
      setDragOverDay(weekday);
    }
  };

  const handleDrop = (e: React.DragEvent, targetWeekday: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || activeDragId;
    setDragOverDay(null);
    setActiveDragId(null);

    if (!id) return;

    const currentItem = items.find((item) => item.id === id);
    if (!currentItem || currentItem.weekday === targetWeekday) return;

    // 1. Atualização Otimista local
    const oldWeekday = currentItem.weekday;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, weekday: targetWeekday } : item))
    );

    // 2. Persistir no Servidor
    startTransition(async () => {
      const result = await moveScheduleAction(id, targetWeekday);
      if (result.error) {
        toast.error(result.error);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, weekday: oldWeekday } : item))
        );
      } else {
        toast.success(`Aula movida para ${WEEKDAY_LABELS[targetWeekday]}`);
      }
    });
  };

  // Aulas do dia selecionado (Visão Diária)
  const currentDayClasses = items
    .filter((s) => s.weekday === selectedWeekday)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <>
      <style>{`
        .rotina-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .day-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .day-tab-btn {
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all var(--transition);
        }
        .day-tab-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .day-tab-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .today-pill {
          font-size: 9px;
          padding: 1px 5px;
          border-radius: 4px;
          background: var(--accent);
          color: white;
          font-weight: 700;
          text-transform: uppercase;
        }

        .mode-toggle-group {
          display: inline-flex;
          background: var(--surface-2);
          padding: 3px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }
        .mode-toggle-btn {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all var(--transition);
        }
        .mode-toggle-btn.active {
          background: var(--surface);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        /* Visão Diária */
        .day-focus-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }
        .day-focus-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .timeline-item {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 640px) {
          .timeline-item { grid-template-columns: 1fr; gap: 6px; }
        }

        .timeline-time-badge {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .timeline-class-content {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-left: 4px solid;
          border-radius: var(--radius-sm);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          transition: transform var(--transition);
        }
        .timeline-class-content:hover {
          transform: translateX(3px);
        }

        /* Visão Semanal (Cards lado a lado) */
        .week-view-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(130px, 1fr));
          gap: 12px;
          overflow-x: auto;
        }
        @media (max-width: 1024px) {
          .week-view-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .week-col {
          background: var(--surface);
          border: 1.5px dashed var(--border);
          border-radius: var(--radius);
          padding: 10px;
          min-height: 260px;
          transition: all var(--transition);
        }
        .week-col.drag-over {
          border-color: var(--primary);
          background: var(--primary-light);
        }
        .week-col-header {
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          padding: 6px;
          background: var(--surface-2);
          border-radius: var(--radius-sm);
          margin-bottom: 10px;
          color: var(--text-secondary);
        }
        .week-col-header.is-today {
          background: var(--primary);
          color: white;
        }
        .week-class-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-left: 3.5px solid;
          border-radius: var(--radius-sm);
          padding: 10px;
          margin-bottom: 8px;
          cursor: grab;
          transition: transform var(--transition), box-shadow var(--transition);
        }
        .week-class-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
      `}</style>

      {/* Modais de Formulário */}
      {editingItem && (
        <AddScheduleForm
          subjects={subjects}
          initialData={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {addingForDay !== null && (
        <AddScheduleForm
          subjects={subjects}
          initialWeekday={addingForDay}
          onClose={() => setAddingForDay(null)}
        />
      )}

      {/* Barra Superior de Seleção de Dia e Modo de Visão */}
      <div className="rotina-header-bar">
        <div className="day-tabs">
          {WEEKDAYS_ORDER.map((wd) => {
            const isToday = wd === today;
            const isSelected = wd === selectedWeekday;
            return (
              <button
                key={wd}
                className={`day-tab-btn ${isSelected ? "active" : ""}`}
                onClick={() => {
                  setSelectedWeekday(wd);
                  setViewMode("day");
                }}
              >
                <span>{WEEKDAY_LABELS[wd]}</span>
                {isToday && <span className="today-pill">Hoje</span>}
              </button>
            );
          })}
        </div>

        <div className="mode-toggle-group">
          <button
            className={`mode-toggle-btn ${viewMode === "day" ? "active" : ""}`}
            onClick={() => setViewMode("day")}
          >
            <Calendar size={14} />
            Visão do Dia
          </button>
          <button
            className={`mode-toggle-btn ${viewMode === "week" ? "active" : ""}`}
            onClick={() => setViewMode("week")}
          >
            <LayoutGrid size={14} />
            Semana Completa
          </button>
        </div>
      </div>

      {/* MODO 1: VISÃO DIÁRIA (FOCO NO DIA SELECIONADO) */}
      {viewMode === "day" && (
        <div className="day-focus-card animate-fade-in">
          <div className="day-focus-title">
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {WEEKDAY_LABELS[selectedWeekday]}
              {selectedWeekday === today && (
                <span className="today-pill" style={{ fontSize: 11, padding: "2px 8px" }}>
                  Hoje
                </span>
              )}
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setAddingForDay(selectedWeekday)}
            >
              <Plus size={14} />
              Adicionar aula na {WEEKDAY_LABELS[selectedWeekday]}
            </button>
          </div>

          {currentDayClasses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--surface-2)",
                  color: "var(--text-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <CalendarDays size={28} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                Nenhuma aula cadastrada na {WEEKDAY_LABELS[selectedWeekday]}
              </p>
              <p style={{ fontSize: 13, marginBottom: 20 }}>
                Aproveite o dia livre ou clique no botão abaixo para agendar um horário.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setAddingForDay(selectedWeekday)}
              >
                + Agendar aula neste dia
              </button>
            </div>
          ) : (
            <div className="timeline-list">
              {currentDayClasses.map((cls) => (
                <div key={cls.id} className="timeline-item">
                  <div className="timeline-time-badge">
                    <Clock size={14} className="text-primary" />
                    {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                  </div>
                  <div
                    className="timeline-class-content"
                    style={{ borderLeftColor: cls.subjects.color }}
                  >
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: cls.subjects.color, marginBottom: 4 }}>
                        {cls.subjects.name}
                      </h3>
                      <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-muted)" }}>
                        {cls.room && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <MapPin size={13} />
                            {cls.room}
                          </span>
                        )}
                        {cls.subjects.professor && (
                          <span>Prof. {cls.subjects.professor}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 6 }}
                        onClick={() => setEditingItem(cls)}
                        aria-label="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 6, color: "var(--danger)" }}
                        onClick={() => handleDelete(cls.id, cls.subjects.name)}
                        disabled={isPending}
                        aria-label="Excluir"
                      >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODO 2: VISÃO SEMANAL COMPLETA (CARDS POR DIA COM ARRASTAR E SOLTAR) */}
      {viewMode === "week" && (
        <div className="week-view-grid animate-fade-in">
          {WEEKDAYS_ORDER.map((wd) => {
            const dayClasses = items
              .filter((s) => s.weekday === wd)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));
            const isToday = wd === today;
            const isOver = dragOverDay === wd;

            return (
              <div
                key={wd}
                className={`week-col ${isOver ? "drag-over" : ""}`}
                onDragOver={(e) => handleDragOver(e, wd)}
                onDrop={(e) => handleDrop(e, wd)}
              >
                <div className={`week-col-header ${isToday ? "is-today" : ""}`}>
                  {WEEKDAY_LABELS[wd]}
                </div>

                {dayClasses.length === 0 ? (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-disabled)",
                      textAlign: "center",
                      padding: "24px 0",
                    }}
                  >
                    Livre
                  </div>
                ) : (
                  dayClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="week-class-card"
                      style={{ borderLeftColor: cls.subjects.color }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, cls.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: cls.subjects.color }}>
                          {cls.subjects.name}
                        </div>
                        <div style={{ display: "flex", gap: 2 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: 2 }}
                            onClick={() => setEditingItem(cls)}
                          >
                            <Edit2 size={11} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={11} />
                        {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                      </div>

                      {cls.room && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={11} />
                          {cls.room}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
