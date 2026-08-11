import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface SubjectSignal {
  id: string;
  name: string;
  color: string;
  averageGrade: number | null;
  previousAverage: number | null;
  gradeTrend: "up" | "down" | "stable" | "no_data";
  slope: number;
  trendChangeDetected: boolean;
  totalAbsences: number;
  maxAbsences: number | null;
  absencePercentage: number | null; // % of max_absences used
  absencesRemaining: number | null;
  absenceRiskLevel: "ok" | "attention" | "high";
  pendingTasksCount: number;
}

export interface TaskSignal {
  total: number;
  pending: number;
  inProgress: number;
  done: number;
  overdue: number;
  completionRate: number; // 0 to 100
}

export interface StreakSignal {
  tasksDoneStreak: number;
  recentPresencesCount: number;
}

export interface UpcomingDateSignal {
  id: string;
  title: string;
  event_date: string;
  daysLeft: number;
  category: "prova" | "entrega" | "evento" | "administrativo" | "outro";
  subjectName?: string;
}

export interface WorkloadSignal {
  totalWeeklyClassHours: number;
  pendingTaskEstimatedHours: number;
  totalWeeklyDemandHours: number;
  workloadStatus: "heavy" | "moderate" | "balanced";
}

export interface DayDistribution {
  weekday: number; // 0=Dom, 1=Seg, ..., 6=Sáb
  dayName: string;
  classCount: number;
  classHours: number;
  taskDueCount: number;
  importantDateCount: number;
  totalEvents: number;
}

export interface RoutineDistributionSignal {
  days: DayDistribution[];
  peakDays: string[];
  idleDays: string[]; // Dias úteis (1-5) sem nenhuma atividade
}

export interface SubjectRiskRankItem {
  subjectId: string;
  subjectName: string;
  color: string;
  riskScore: number; // 0 a 100
  riskLevel: "high" | "attention" | "ok";
  primaryReason: string;
  suggestedAction: string;
}

export interface SignalsSnapshot {
  calculatedAt: string;
  periodType: "daily" | "weekly" | "monthly";
  subjects: SubjectSignal[];
  tasks: TaskSignal;
  streaks: StreakSignal;
  upcomingDates: UpcomingDateSignal[];
  workload: WorkloadSignal;
  routine: RoutineDistributionSignal;
  subjectRiskRanking: SubjectRiskRankItem[];
}

const WEEKDAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function parseTimeHours(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

function calculateLinearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
}

export async function calculateUserSignals(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodType: "daily" | "weekly" | "monthly" = "daily"
): Promise<SignalsSnapshot> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Fetch all user data in parallel
  const [
    { data: subjects },
    { data: grades },
    { data: tasks },
    { data: attendance },
    { data: importantDates },
    { data: schedules },
  ] = await Promise.all([
    supabase.from("subjects").select("*").eq("user_id", userId),
    supabase.from("grades").select("*").eq("user_id", userId).order("exam_date", { ascending: true }),
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("attendance").select("*").eq("user_id", userId),
    supabase.from("important_dates").select("*, subjects(name)").eq("user_id", userId).order("event_date", { ascending: true }),
    supabase.from("schedule").select("*").eq("user_id", userId),
  ]);

  const userSubjects = subjects ?? [];
  const userGrades = grades ?? [];
  const userTasks = tasks ?? [];
  const userAttendance = attendance ?? [];
  const userDates = importantDates ?? [];
  const userSchedules = schedules ?? [];

  // 1. Process Subject Signals
  const subjectSignals: SubjectSignal[] = userSubjects.map((sub) => {
    const subGrades = userGrades.filter((g) => g.subject_id === sub.id);
    const subAttendance = userAttendance.filter((a) => a.subject_id === sub.id);
    const subTasksPending = userTasks.filter((t) => t.subject_id === sub.id && t.status !== "done").length;

    // Grades calculation
    const totalWeight = subGrades.reduce((acc, g) => acc + g.weight, 0);
    const weightedSum = subGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
    const averageGrade = totalWeight > 0 ? weightedSum / totalWeight : null;

    // Linear regression slope & Previous Average
    const gradeValues = subGrades.map((g) => Number(g.value));
    const slope = calculateLinearRegressionSlope(gradeValues);

    let previousAverage: number | null = null;
    let gradeTrend: "up" | "down" | "stable" | "no_data" = "no_data";
    let trendChangeDetected = false;

    if (subGrades.length >= 2) {
      const olderGrades = subGrades.slice(0, -1);
      const olderWeight = olderGrades.reduce((acc, g) => acc + g.weight, 0);
      const olderSum = olderGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
      previousAverage = olderWeight > 0 ? olderSum / olderWeight : null;

      if (slope > 0.05) gradeTrend = "up";
      else if (slope < -0.05) gradeTrend = "down";
      else gradeTrend = "stable";

      // Detect trend change: if older slope was flat/rising but overall slope turned down
      const olderValues = olderGrades.map((g) => Number(g.value));
      const olderSlope = calculateLinearRegressionSlope(olderValues);
      if (olderSlope >= -0.02 && slope < -0.05) {
        trendChangeDetected = true;
      }
    } else if (subGrades.length === 1) {
      gradeTrend = "stable";
    }

    // Absences calculation
    const totalAbsences = subAttendance.filter((a) => !a.present).length;
    const maxAbs = sub.max_absences;
    let absencePercentage: number | null = null;
    let absencesRemaining: number | null = null;
    let absenceRiskLevel: "ok" | "attention" | "high" = "ok";

    if (maxAbs != null && maxAbs > 0) {
      absencePercentage = Math.round((totalAbsences / maxAbs) * 100);
      absencesRemaining = Math.max(0, maxAbs - totalAbsences);

      if (totalAbsences >= maxAbs || absencePercentage >= 80) {
        absenceRiskLevel = "high";
      } else if (absencePercentage >= 50) {
        absenceRiskLevel = "attention";
      }
    }

    return {
      id: sub.id,
      name: sub.name,
      color: sub.color,
      averageGrade: averageGrade !== null ? Number(averageGrade.toFixed(2)) : null,
      previousAverage: previousAverage !== null ? Number(previousAverage.toFixed(2)) : null,
      gradeTrend,
      slope: Number(slope.toFixed(3)),
      trendChangeDetected,
      totalAbsences,
      maxAbsences: maxAbs,
      absencePercentage,
      absencesRemaining,
      absenceRiskLevel,
      pendingTasksCount: subTasksPending,
    };
  });

  // 2. Process Task Signals
  const totalTasks = userTasks.length;
  const pendingTasks = userTasks.filter((t) => t.status === "pending").length;
  const inProgressTasks = userTasks.filter((t) => t.status === "in_progress").length;
  const doneTasks = userTasks.filter((t) => t.status === "done").length;

  const nowMs = Date.now();
  const overdueTasks = userTasks.filter((t) => {
    if (t.status === "done" || !t.due_date) return false;
    return new Date(t.due_date).getTime() < nowMs;
  }).length;

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 100;

  // 3. Process Streaks
  const tasksDoneStreak = doneTasks;
  const recentPresencesCount = userAttendance.filter((a) => a.present).length;

  // 4. Process Upcoming Important Dates (Window based on periodType: daily=7d, weekly=14d, monthly=30d)
  const windowDays = periodType === "monthly" ? 30 : periodType === "weekly" ? 14 : 7;
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  const upcomingDates: UpcomingDateSignal[] = userDates
    .filter((d) => {
      const eventMs = new Date(d.event_date + "T00:00:00").getTime();
      const diff = eventMs - new Date(todayStr + "T00:00:00").getTime();
      return diff >= 0 && diff <= windowMs;
    })
    .map((d) => {
      const eventMs = new Date(d.event_date + "T00:00:00").getTime();
      const daysLeft = Math.round((eventMs - new Date(todayStr + "T00:00:00").getTime()) / (24 * 60 * 60 * 1000));
      return {
        id: d.id,
        title: d.title,
        event_date: d.event_date,
        daysLeft,
        category: d.category,
        subjectName: (d.subjects as { name?: string } | null)?.name,
      };
    });

  // 5. Workload Signal (Carga de Estudo vs Disponibilidade)
  let totalWeeklyClassHours = 0;
  for (const s of userSchedules) {
    const duration = parseTimeHours(s.end_time) - parseTimeHours(s.start_time);
    if (duration > 0) totalWeeklyClassHours += duration;
  }
  totalWeeklyClassHours = Number(totalWeeklyClassHours.toFixed(1));

  let pendingTaskEstimatedHours = 0;
  for (const t of userTasks) {
    if (t.status !== "done") {
      const hours = t.priority === "high" ? 3 : t.priority === "medium" ? 2 : 1;
      pendingTaskEstimatedHours += hours;
    }
  }

  const totalWeeklyDemandHours = Number((totalWeeklyClassHours + pendingTaskEstimatedHours).toFixed(1));
  const workloadStatus: WorkloadSignal["workloadStatus"] =
    totalWeeklyDemandHours > 35 ? "heavy" : totalWeeklyDemandHours > 20 ? "moderate" : "balanced";

  // 6. Routine Distribution (Distribuição da Rotina & Dias Ociosos)
  const dayDistributionMap: Record<number, DayDistribution> = {};
  for (let w = 0; w < 7; w++) {
    dayDistributionMap[w] = {
      weekday: w,
      dayName: WEEKDAY_NAMES[w],
      classCount: 0,
      classHours: 0,
      taskDueCount: 0,
      importantDateCount: 0,
      totalEvents: 0,
    };
  }

  for (const s of userSchedules) {
    const w = s.weekday;
    if (dayDistributionMap[w]) {
      dayDistributionMap[w].classCount += 1;
      const duration = parseTimeHours(s.end_time) - parseTimeHours(s.start_time);
      if (duration > 0) dayDistributionMap[w].classHours += duration;
    }
  }

  for (const t of userTasks) {
    if (t.due_date) {
      const d = new Date(t.due_date);
      const w = d.getDay();
      if (dayDistributionMap[w]) {
        dayDistributionMap[w].taskDueCount += 1;
      }
    }
  }

  for (const idate of userDates) {
    const d = new Date(idate.event_date + "T00:00:00");
    const w = d.getDay();
    if (dayDistributionMap[w]) {
      dayDistributionMap[w].importantDateCount += 1;
    }
  }

  const days: DayDistribution[] = Object.values(dayDistributionMap).map((d) => ({
    ...d,
    classHours: Number(d.classHours.toFixed(1)),
    totalEvents: d.classCount + d.taskDueCount + d.importantDateCount,
  }));

  const peakDays = days.filter((d) => d.totalEvents >= 3).map((d) => d.dayName);
  // Dias ociosos: dias úteis (Segunda a Sexta, weekday 1..5) sem aulas nem entregas
  const idleDays = days.filter((d) => d.weekday >= 1 && d.weekday <= 5 && d.totalEvents === 0).map((d) => d.dayName);

  // 7. Subject Risk Ranking (Ranking de Risco de Matérias)
  const subjectRiskRanking: SubjectRiskRankItem[] = subjectSignals.map((sub) => {
    let score = 0;
    let reason = "Desempenho dentro da normalidade";
    let suggestedAction = "Manter o ritmo de estudos e acompanhamento.";

    // Faltas (máx 40 pts)
    if (sub.absenceRiskLevel === "high") {
      score += 40;
      reason = sub.maxAbsences && sub.totalAbsences >= sub.maxAbsences
        ? "Limite de faltas atingido ou excedido"
        : `Faltas atingiram ${sub.absencePercentage}% do limite`;
      const rem = sub.absencesRemaining ?? 0;
      suggestedAction = rem > 0
        ? `Você só pode faltar mais ${rem} aula(s) nesta matéria.`
        : "Atenção máxima: qualquer nova falta causará reprovação por frequência.";
    } else if (sub.absenceRiskLevel === "attention") {
      score += 20;
      reason = `Faltas em 50%+ do limite (${sub.totalAbsences}/${sub.maxAbsences})`;
      suggestedAction = `Evite faltar. Restam apenas ${sub.absencesRemaining} falta(s) de margem.`;
    }

    // Notas & Tendência (máx 40 pts)
    if (sub.averageGrade !== null) {
      if (sub.averageGrade < 6.0) {
        score += 30;
        reason = `Média crítica de ${sub.averageGrade.toFixed(1)}`;
        suggestedAction = "Priorize esta matéria nas próximas tarefas e provas para atingir média 7.0.";
      } else if (sub.averageGrade < 7.0) {
        score += 15;
        if (score < 30) reason = `Média em atenção (${sub.averageGrade.toFixed(1)})`;
      }

      if (sub.gradeTrend === "down") {
        score += 10;
        if (sub.trendChangeDetected) {
          score += 10;
          reason = `Tendência de queda iniciada recentemente (Média: ${sub.averageGrade.toFixed(1)})`;
          suggestedAction = "Sua média começou a cair. Revise os conteúdos das avaliações anteriores.";
        }
      }
    }

    // Tarefas pendentes (máx 20 pts)
    if (sub.pendingTasksCount > 0) {
      score += Math.min(20, sub.pendingTasksCount * 10);
      if (score < 40) {
        reason = `${sub.pendingTasksCount} tarefa(s) pendente(s) nesta matéria`;
        suggestedAction = "Conclua as tarefas da matéria para não acumular demandas.";
      }
    }

    const finalScore = Math.min(100, score);
    const riskLevel: SubjectRiskRankItem["riskLevel"] = finalScore >= 60 ? "high" : finalScore >= 30 ? "attention" : "ok";

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      color: sub.color,
      riskScore: finalScore,
      riskLevel,
      primaryReason: reason,
      suggestedAction,
    };
  });

  // Ordenar ranking do maior risco para o menor
  subjectRiskRanking.sort((a, b) => b.riskScore - a.riskScore);

  return {
    calculatedAt: new Date().toISOString(),
    periodType,
    subjects: subjectSignals,
    tasks: {
      total: totalTasks,
      pending: pendingTasks,
      inProgress: inProgressTasks,
      done: doneTasks,
      overdue: overdueTasks,
      completionRate,
    },
    streaks: {
      tasksDoneStreak,
      recentPresencesCount,
    },
    upcomingDates,
    workload: {
      totalWeeklyClassHours,
      pendingTaskEstimatedHours,
      totalWeeklyDemandHours,
      workloadStatus,
    },
    routine: {
      days,
      peakDays,
      idleDays,
    },
    subjectRiskRanking,
  };
}
