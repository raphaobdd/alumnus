"use client";

import { useState, useTransition, useEffect } from "react";
import { createSemesterSetupAction, type SemesterSubjectItem } from "@/app/actions/semester";
import { WEEKDAY_LABELS } from "@/lib/validations/schedule";
import { toast } from "sonner";
import {
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  X,
  Loader2,
  Sparkles,
  Clock,
  Layers,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";

const PALETTE_COLORS = [
  "#1d4ed8", // Executive Blue
  "#059669", // Emerald Green
  "#0284c7", // Sky Blue
  "#7c3aed", // Violet
  "#d97706", // Amber
  "#0d9488", // Teal
  "#db2777", // Pink
];

interface SemesterSetupModalProps {
  forceOpen?: boolean;
}

export function SemesterSetupModal({ forceOpen = false }: SemesterSetupModalProps) {
  const [open, setOpen] = useState(forceOpen);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentSemesterDefault = `${currentYear}.${now.getMonth() < 6 ? "1" : "2"}`;

  const [semesterName, setSemesterName] = useState(currentSemesterDefault);
  const [startDate, setStartDate] = useState(`${currentYear}-03-02`);
  const [endDate, setEndDate] = useState(`${currentYear}-07-03`);

  // Formulário individual para adicionar matérias no Passo 2
  const [newSubName, setNewSubName] = useState("");
  const [newSubProf, setNewSubProf] = useState("");
  const [newSubAbsences, setNewSubAbsences] = useState(15);
  const [newSubColor, setNewSubColor] = useState(PALETTE_COLORS[0]);

  // Lista de matérias com suas grades (inicia vazia para inserção manual pelo estudante)
  const [subjects, setSubjects] = useState<SemesterSubjectItem[]>([]);

  const [selectedSubIndex, setSelectedSubIndex] = useState(0);

  const handleAddSubject = () => {
    if (!newSubName.trim()) {
      toast.error("Digite o nome da matéria.");
      return;
    }
    const nextColor = PALETTE_COLORS[subjects.length % PALETTE_COLORS.length];
    const newSub: SemesterSubjectItem = {
      name: newSubName.trim(),
      professor: newSubProf.trim() || undefined,
      max_absences: Number(newSubAbsences) || 15,
      color: newSubColor || nextColor,
      schedules: [{ weekday: 1, start_time: "19:20", end_time: "20:50", room: "" }],
    };

    setSubjects((prev) => [...prev, newSub]);
    setNewSubName("");
    setNewSubProf("");
    setNewSubAbsences(15);
    setNewSubColor(PALETTE_COLORS[(subjects.length + 1) % PALETTE_COLORS.length]);
    toast.success(`Matéria ${newSub.name} adicionada!`);
  };

  const removeSubject = (index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
    if (selectedSubIndex >= index && selectedSubIndex > 0) {
      setSelectedSubIndex((prev) => prev - 1);
    }
  };

  const addScheduleRow = (subIdx: number) => {
    setSubjects((prev) =>
      prev.map((s, i) => {
        if (i !== subIdx) return s;
        return {
          ...s,
          schedules: [
            ...s.schedules,
            { weekday: 1, start_time: "19:20", end_time: "20:50", room: "" },
          ],
        };
      })
    );
  };

  const removeScheduleRow = (subIdx: number, schedIdx: number) => {
    setSubjects((prev) =>
      prev.map((s, i) => {
        if (i !== subIdx) return s;
        return {
          ...s,
          schedules: s.schedules.filter((_, si) => si !== schedIdx),
        };
      })
    );
  };

  const updateScheduleField = (
    subIdx: number,
    schedIdx: number,
    field: string,
    val: any
  ) => {
    setSubjects((prev) =>
      prev.map((s, i) => {
        if (i !== subIdx) return s;
        const updated = s.schedules.map((sc, si) =>
          si === schedIdx ? { ...sc, [field]: val } : sc
        );
        return { ...s, schedules: updated };
      })
    );
  };

  const handleFinish = () => {
    const validSubjects = subjects.filter((s) => s.name.trim() !== "");
    if (validSubjects.length === 0) {
      toast.error("Adicione pelo menos 1 matéria.");
      return;
    }

    startTransition(async () => {
      const result = await createSemesterSetupAction({
        semesterName,
        startDate,
        endDate,
        subjects: validSubjects,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Semestre ${semesterName} cadastrado com sucesso!`);
        setOpen(false);
      }
    });
  };

  return (
    <>
      <button
        id="open-semester-setup-btn"
        className="btn btn-primary"
        onClick={() => {
          setStep(1);
          setOpen(true);
        }}
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      >
        <Layers size={16} />
        Cadastrar Semestre
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 250,
            padding: 16,
            animation: "fade-in 0.15s ease",
          }}
          onClick={(e) => e.target === e.currentTarget && !forceOpen && setOpen(false)}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              width: "100%",
              maxWidth: 620,
              boxShadow: "var(--shadow-lg)",
              animation: "scale-in 0.2s ease",
            }}
            role="dialog"
            aria-modal
            aria-label="Assistente de Cadastro do Semestre"
          >
            {/* Cabeçalho do Wizard */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>
                    Configurar Semestre ({semesterName})
                  </h2>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Passo {step} de 3 — {step === 1 ? "Período" : step === 2 ? "Matérias" : "Grade Horária"}
                  </p>
                </div>
              </div>

              {!forceOpen && (
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
              )}
            </div>

            {/* Barra de Progresso Visual (Stepper) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 20 }}>
              <div
                style={{
                  height: 4,
                  borderRadius: 99,
                  background: step >= 1 ? "var(--primary)" : "var(--surface-2)",
                  transition: "all 0.3s ease",
                }}
              />
              <div
                style={{
                  height: 4,
                  borderRadius: 99,
                  background: step >= 2 ? "var(--primary)" : "var(--surface-2)",
                  transition: "all 0.3s ease",
                }}
              />
              <div
                style={{
                  height: 4,
                  borderRadius: 99,
                  background: step >= 3 ? "var(--primary)" : "var(--surface-2)",
                  transition: "all 0.3s ease",
                }}
              />
            </div>

            {/* PASSO 1: PERÍODO DO SEMESTRE */}
            {step === 1 && (
              <div className="animate-fade-in">
                <div
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: 18,
                    marginBottom: 20,
                  }}
                >
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={15} className="text-primary" />
                    Qual o período deste semestre?
                  </h3>

                  <div style={{ marginBottom: 12 }}>
                    <label className="label" htmlFor="wiz-sem-name">Identificação do Semestre *</label>
                    <input
                      id="wiz-sem-name"
                      className="input"
                      value={semesterName}
                      onChange={(e) => setSemesterName(e.target.value)}
                      placeholder="Ex: 2026.1"
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label className="label" htmlFor="wiz-start-date">Início das Aulas</label>
                      <input
                        id="wiz-start-date"
                        type="date"
                        className="input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="wiz-end-date">Fim do Semestre</label>
                      <input
                        id="wiz-end-date"
                        type="date"
                        className="input"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!semesterName.trim()) return toast.error("Informe a identificação do semestre.");
                      setStep(2);
                    }}
                  >
                    Próximo: Adicionar Matérias <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 2: ADICIONAR MATÉRIAS */}
            {step === 2 && (
              <div className="animate-fade-in">
                {/* Form simples para inserir matéria */}
                <div
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <BookOpen size={14} className="text-primary" />
                    Adicionar Matéria ao Semestre
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label className="label">Nome da Matéria *</label>
                      <input
                        className="input"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="Ex: Cálculo I, Algoritmos..."
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubject())}
                      />
                    </div>
                    <div>
                      <label className="label">Professor (opcional)</label>
                      <input
                        className="input"
                        value={newSubProf}
                        onChange={(e) => setNewSubProf(e.target.value)}
                        placeholder="Ex: Prof. Ricardo"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubject())}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Cor:</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {PALETTE_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: c,
                              border: newSubColor === c ? "2px solid var(--text-primary)" : "none",
                              cursor: "pointer",
                            }}
                            onClick={() => setNewSubColor(c)}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddSubject}
                    >
                      <Plus size={14} />
                      + Inserir Matéria
                    </button>
                  </div>
                </div>

                {/* Lista Limpa das Matérias já Adicionadas */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>
                    Matérias neste semestre ({subjects.length}):
                  </div>
                  {subjects.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                      Nenhuma matéria adicionada ainda. Digite o nome acima e clique em + Inserir.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                      {subjects.map((sub, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            background: "var(--surface-2)",
                            borderLeft: `4px solid ${sub.color}`,
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700, color: sub.color }}>
                            {sub.name} {sub.professor ? `(${sub.professor})` : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSubject(idx)}
                            style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", padding: 2 }}
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                    <ChevronLeft size={16} /> Voltar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (subjects.length === 0) return toast.error("Adicione pelo menos 1 matéria.");
                      setStep(3);
                    }}
                  >
                    Próximo: Montar Grade <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 3: MONTAR GRADE HORÁRIA DAS MATÉRIAS */}
            {step === 3 && (
              <div className="animate-fade-in">
                {/* Abas das Matérias para Configuração Rápida */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 14 }}>
                  {subjects.map((sub, idx) => (
                    <button
                      key={idx}
                      type="button"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 12,
                        fontWeight: 700,
                        border: `1px solid ${selectedSubIndex === idx ? sub.color : "var(--border)"}`,
                        background: selectedSubIndex === idx ? sub.color : "transparent",
                        color: selectedSubIndex === idx ? "white" : sub.color,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      onClick={() => setSelectedSubIndex(idx)}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>

                {/* Grade da Matéria Selecionada */}
                {subjects[selectedSubIndex] && (
                  <div
                    style={{
                      background: "var(--surface-2)",
                      border: `1.5px solid ${subjects[selectedSubIndex].color}`,
                      borderRadius: "var(--radius-sm)",
                      padding: 16,
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: subjects[selectedSubIndex].color, display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={14} />
                        Horários de {subjects[selectedSubIndex].name}
                      </h4>
                      <button
                        type="button"
                        style={{ fontSize: 11, fontWeight: 700, background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer" }}
                        onClick={() => addScheduleRow(selectedSubIndex)}
                      >
                        + Adicionar Aula
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {subjects[selectedSubIndex].schedules.map((sched, scIdx) => (
                        <div key={scIdx} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 24px", gap: 6, alignItems: "center" }}>
                          <select
                            className="input"
                            style={{ padding: "4px 6px", fontSize: 12 }}
                            value={sched.weekday}
                            onChange={(e) => updateScheduleField(selectedSubIndex, scIdx, "weekday", Number(e.target.value))}
                          >
                            {WEEKDAY_LABELS.map((label, idx) => (
                              <option key={idx} value={idx}>{label}</option>
                            ))}
                          </select>
                          <input
                            type="time"
                            className="input"
                            style={{ padding: "4px 6px", fontSize: 12 }}
                            value={sched.start_time}
                            onChange={(e) => updateScheduleField(selectedSubIndex, scIdx, "start_time", e.target.value)}
                          />
                          <input
                            type="time"
                            className="input"
                            style={{ padding: "4px 6px", fontSize: 12 }}
                            value={sched.end_time}
                            onChange={(e) => updateScheduleField(selectedSubIndex, scIdx, "end_time", e.target.value)}
                          />
                          <input
                            className="input"
                            style={{ padding: "4px 6px", fontSize: 12 }}
                            placeholder="Sala"
                            value={sched.room || ""}
                            onChange={(e) => updateScheduleField(selectedSubIndex, scIdx, "room", e.target.value)}
                          />
                          {subjects[selectedSubIndex].schedules.length > 1 && (
                            <button
                              type="button"
                              style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer" }}
                              onClick={() => removeScheduleRow(selectedSubIndex, scIdx)}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                    <ChevronLeft size={16} /> Voltar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isPending}
                    onClick={handleFinish}
                    style={{ background: "var(--accent)", borderColor: "var(--accent)" }}
                  >
                    {isPending ? <><Loader2 size={16} className="animate-spin" /> Finalizando...</> : <><CheckCircle2 size={16} /> Concluir Semestre</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
