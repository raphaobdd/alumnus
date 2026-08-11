import { describe, it, expect } from "vitest";
import { evaluateRules } from "./rules";
import type { SignalsSnapshot } from "./signals";

describe("lib/intelligence/rules — evaluateRules", () => {
  const createEmptySnapshot = (): SignalsSnapshot => ({
    calculatedAt: new Date().toISOString(),
    periodType: "daily",
    subjects: [],
    workload: {
      totalWeeklyClassHours: 0,
      pendingTaskEstimatedHours: 0,
      totalWeeklyDemandHours: 0,
      workloadStatus: "balanced",
    },
    routine: {
      days: [],
      peakDays: [],
      idleDays: [],
    },
    tasks: {
      total: 0,
      pending: 0,
      inProgress: 0,
      done: 0,
      overdue: 0,
      completionRate: 100,
    },
    streaks: {
      tasksDoneStreak: 0,
      recentPresencesCount: 0,
    },
    upcomingDates: [],
    subjectRiskRanking: [],
  });

  it("deve retornar risco 'none' e resumo neutro quando não houver dados/alertas", () => {
    const snapshot = createEmptySnapshot();
    const result = evaluateRules(snapshot);

    expect(result.overallRisk).toBe("none");
    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.messages[0].category).toBe("general");
    expect(result.messages[0].level).toBe("neutral");
  });

  it("deve disparar risco 'high' quando o limite de faltas for ultrapassado", () => {
    const snapshot = createEmptySnapshot();
    snapshot.subjects = [
      {
        id: "sub-1",
        name: "Cálculo I",
        color: "#1d4ed8",
        totalAbsences: 12,
        maxAbsences: 10,
        absencePercentage: 120,
        absencesRemaining: 0,
        absenceRiskLevel: "high",
        averageGrade: 7.0,
        previousAverage: null,
        gradeTrend: "stable",
        slope: 0,
        trendChangeDetected: false,
        pendingTasksCount: 0,
      },
    ];

    const result = evaluateRules(snapshot);
    expect(result.overallRisk).toBe("high");

    const highMessage = result.messages.find((m) => m.level === "high" && m.category === "absence");
    expect(highMessage).toBeDefined();
    expect(highMessage?.text).toContain("Cálculo I");
  });

  it("deve identificar tarefas vencidas e ajustar o nível de risco", () => {
    const snapshot = createEmptySnapshot();
    snapshot.tasks = {
      total: 5,
      pending: 2,
      inProgress: 1,
      done: 2,
      overdue: 4,
      completionRate: 40,
    };

    const result = evaluateRules(snapshot);
    expect(result.overallRisk).toBe("high");

    const taskMessage = result.messages.find((m) => m.category === "task");
    expect(taskMessage).toBeDefined();
    expect(taskMessage?.level).toBe("high");
  });

  it("deve gerar feedback positivo para notas altas", () => {
    const snapshot = createEmptySnapshot();
    snapshot.subjects = [
      {
        id: "sub-2",
        name: "Física Geral",
        color: "#059669",
        totalAbsences: 1,
        maxAbsences: 10,
        absencePercentage: 10,
        absencesRemaining: 9,
        absenceRiskLevel: "ok",
        averageGrade: 9.5,
        previousAverage: null,
        gradeTrend: "stable",
        slope: 0,
        trendChangeDetected: false,
        pendingTasksCount: 0,
      },
    ];

    const result = evaluateRules(snapshot);
    const positiveMessage = result.messages.find((m) => m.level === "positive");
    expect(positiveMessage).toBeDefined();
    expect(positiveMessage?.text).toContain("Física Geral");
  });
});
