import type { SignalsSnapshot } from "./signals";
import { TEMPLATES, formatTemplate, type ReportMessage } from "./templates";

export interface EvaluationResult {
  overallRisk: "none" | "attention" | "high";
  messages: ReportMessage[];
}

export function evaluateRules(signals: SignalsSnapshot): EvaluationResult {
  const messages: ReportMessage[] = [];
  let overallRisk: "none" | "attention" | "high" = "none";

  const setRiskLevel = (level: "none" | "attention" | "high") => {
    if (level === "high") {
      overallRisk = "high";
    } else if (level === "attention" && overallRisk !== "high") {
      overallRisk = "attention";
    }
  };

  // 1. Regras de Faltas
  for (const sub of signals.subjects) {
    if (sub.maxAbsences != null && sub.maxAbsences > 0) {
      if (sub.totalAbsences >= sub.maxAbsences) {
        setRiskLevel("high");
        messages.push({
          level: "high",
          category: "absence",
          title: TEMPLATES.highRisk.absenceLimitExceeded.title,
          text: formatTemplate(TEMPLATES.highRisk.absenceLimitExceeded.text, {
            subject: sub.name,
            maxAbsences: sub.maxAbsences,
            totalAbsences: sub.totalAbsences,
          }),
        });
      } else if (sub.absencePercentage != null && sub.absencePercentage >= 80) {
        setRiskLevel("high");
        messages.push({
          level: "high",
          category: "absence",
          title: TEMPLATES.highRisk.absenceLimitNear.title,
          text: formatTemplate(TEMPLATES.highRisk.absenceLimitNear.text, {
            subject: sub.name,
            percentage: sub.absencePercentage,
            totalAbsences: sub.totalAbsences,
            maxAbsences: sub.maxAbsences,
            remaining: sub.absencesRemaining ?? 0,
          }),
        });
      } else if (sub.absencePercentage != null && sub.absencePercentage >= 50) {
        setRiskLevel("attention");
        messages.push({
          level: "attention",
          category: "absence",
          title: TEMPLATES.attention.absenceWarning.title,
          text: formatTemplate(TEMPLATES.attention.absenceWarning.text, {
            subject: sub.name,
            percentage: sub.absencePercentage,
            totalAbsences: sub.totalAbsences,
            maxAbsences: sub.maxAbsences,
          }),
        });
      }
    }
  }

  // 2. Regras de Notas
  for (const sub of signals.subjects) {
    if (sub.gradeTrend === "down" && sub.averageGrade !== null && sub.previousAverage !== null) {
      setRiskLevel("high");
      messages.push({
        level: "high",
        category: "grade",
        title: TEMPLATES.highRisk.gradeDroppingFast.title,
        text: formatTemplate(TEMPLATES.highRisk.gradeDroppingFast.text, {
          subject: sub.name,
          previousAverage: sub.previousAverage.toFixed(1),
          currentAverage: sub.averageGrade.toFixed(1),
        }),
      });
    } else if (sub.gradeTrend === "up" && sub.averageGrade !== null && sub.previousAverage !== null) {
      if (overallRisk === "none") setRiskLevel("none");
      messages.push({
        level: "positive",
        category: "grade",
        title: TEMPLATES.positive.gradeRising.title,
        text: formatTemplate(TEMPLATES.positive.gradeRising.text, {
          subject: sub.name,
          currentAverage: sub.averageGrade.toFixed(1),
          previousAverage: sub.previousAverage.toFixed(1),
        }),
      });
    } else if (sub.averageGrade !== null && sub.averageGrade >= 8.5) {
      messages.push({
        level: "positive",
        category: "grade",
        title: TEMPLATES.positive.excellentGrades.title,
        text: formatTemplate(TEMPLATES.positive.excellentGrades.text, {
          subject: sub.name,
          currentAverage: sub.averageGrade.toFixed(1),
        }),
      });
    }
  }

  // 3. Regras de Tarefas
  if (signals.tasks.overdue > 0) {
    setRiskLevel(signals.tasks.overdue >= 3 ? "high" : "attention");
    messages.push({
      level: signals.tasks.overdue >= 3 ? "high" : "attention",
      category: "task",
      title: TEMPLATES.highRisk.multipleOverdueTasks.title,
      text: formatTemplate(TEMPLATES.highRisk.multipleOverdueTasks.text, {
        count: signals.tasks.overdue,
      }),
    });
  } else if (signals.tasks.total > 0 && signals.tasks.pending === 0 && signals.tasks.inProgress === 0) {
    messages.push({
      level: "positive",
      category: "task",
      title: TEMPLATES.positive.allTasksDone.title,
      text: TEMPLATES.positive.allTasksDone.text,
    });
  } else if (signals.tasks.pending > 0) {
    messages.push({
      level: "attention",
      category: "task",
      title: TEMPLATES.attention.taskPending.title,
      text: formatTemplate(TEMPLATES.attention.taskPending.text, {
        count: signals.tasks.pending + signals.tasks.inProgress,
      }),
    });
  }

  // 4. Regras de Datas Importantes Próximas
  for (const dateSignal of signals.upcomingDates) {
    const formattedDate = new Date(dateSignal.event_date + "T00:00:00").toLocaleDateString("pt-BR");
    if (dateSignal.category === "prova") {
      setRiskLevel("attention");
      messages.push({
        level: "attention",
        category: "calendar",
        title: TEMPLATES.attention.upcomingExam.title,
        text: formatTemplate(TEMPLATES.attention.upcomingExam.text, {
          subject: dateSignal.subjectName || "Geral",
          title: dateSignal.title,
          daysLeft: dateSignal.daysLeft,
          eventDate: formattedDate,
        }),
      });
    } else {
      messages.push({
        level: "attention",
        category: "calendar",
        title: TEMPLATES.attention.upcomingImportantDate.title,
        text: formatTemplate(TEMPLATES.attention.upcomingImportantDate.text, {
          title: dateSignal.title,
          category: dateSignal.category.toUpperCase(),
          daysLeft: dateSignal.daysLeft,
          eventDate: formattedDate,
        }),
      });
    }
  }

  // 5. Mensagem neutra padrão se não houver alertas
  if (messages.length === 0) {
    messages.push({
      level: "neutral",
      category: "general",
      title: TEMPLATES.neutral.dailySummary.title,
      text: formatTemplate(TEMPLATES.neutral.dailySummary.text, {
        subjectCount: signals.subjects.length,
        taskCount: signals.tasks.pending + signals.tasks.inProgress,
      }),
    });
  }

  // Ordenar mensagens por prioridade (high > attention > neutral > positive)
  const orderMap = { high: 0, attention: 1, neutral: 2, positive: 3 };
  messages.sort((a, b) => orderMap[a.level] - orderMap[b.level]);

  return {
    overallRisk,
    messages,
  };
}
