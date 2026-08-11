import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface SubjectSignal {
  id: string;
  name: string;
  color: string;
  averageGrade: number | null;
  previousAverage: number | null;
  gradeTrend: "up" | "down" | "stable" | "no_data";
  totalAbsences: number;
  maxAbsences: number | null;
  absencePercentage: number | null; // % of max_absences used
  absencesRemaining: number | null;
  absenceRiskLevel: "ok" | "attention" | "high";
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

export interface SignalsSnapshot {
  calculatedAt: string;
  subjects: SubjectSignal[];
  tasks: TaskSignal;
  streaks: StreakSignal;
  upcomingDates: UpcomingDateSignal[];
}

export async function calculateUserSignals(
  supabase: SupabaseClient<Database>,
  userId: string
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
  ] = await Promise.all([
    supabase.from("subjects").select("*").eq("user_id", userId),
    supabase.from("grades").select("*").eq("user_id", userId).order("exam_date", { ascending: true }),
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("attendance").select("*").eq("user_id", userId),
    supabase.from("important_dates").select("*, subjects(name)").eq("user_id", userId).order("event_date", { ascending: true }),
  ]);

  const userSubjects = subjects ?? [];
  const userGrades = grades ?? [];
  const userTasks = tasks ?? [];
  const userAttendance = attendance ?? [];
  const userDates = importantDates ?? [];

  // 1. Process Subject Signals
  const subjectSignals: SubjectSignal[] = userSubjects.map((sub) => {
    const subGrades = userGrades.filter((g) => g.subject_id === sub.id);
    const subAttendance = userAttendance.filter((a) => a.subject_id === sub.id);

    // Grades calculation
    const totalWeight = subGrades.reduce((acc, g) => acc + g.weight, 0);
    const weightedSum = subGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
    const averageGrade = totalWeight > 0 ? weightedSum / totalWeight : null;

    // Previous average calculation (excluding the most recent grade to check trend)
    let previousAverage: number | null = null;
    let gradeTrend: "up" | "down" | "stable" | "no_data" = "no_data";

    if (subGrades.length >= 2) {
      const olderGrades = subGrades.slice(0, -1);
      const olderWeight = olderGrades.reduce((acc, g) => acc + g.weight, 0);
      const olderSum = olderGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
      previousAverage = olderWeight > 0 ? olderSum / olderWeight : null;

      if (averageGrade !== null && previousAverage !== null) {
        const diff = averageGrade - previousAverage;
        if (diff > 0.3) gradeTrend = "up";
        else if (diff < -0.3) gradeTrend = "down";
        else gradeTrend = "stable";
      }
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
      totalAbsences,
      maxAbsences: maxAbs,
      absencePercentage,
      absencesRemaining,
      absenceRiskLevel,
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

  // 4. Process Upcoming Important Dates (Next 7 Days)
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const upcomingDates: UpcomingDateSignal[] = userDates
    .filter((d) => {
      const eventMs = new Date(d.event_date + "T00:00:00").getTime();
      const diff = eventMs - new Date(todayStr + "T00:00:00").getTime();
      return diff >= 0 && diff <= sevenDaysMs;
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

  return {
    calculatedAt: new Date().toISOString(),
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
  };
}
