import { describe, it, expect } from "vitest";
import { taskSchema, updateTaskStatusSchema } from "./tasks";
import { gradeSchema } from "./grades";

describe("lib/validations/tasks — taskSchema", () => {
  it("deve validar com sucesso uma tarefa válida", () => {
    const validData = {
      title: "Entregar trabalho de Cálculo",
      priority: "high" as const,
      status: "pending" as const,
    };
    const result = taskSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("deve rejeitar uma tarefa sem título", () => {
    const invalidData = {
      title: "",
      priority: "medium" as const,
    };
    const result = taskSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("deve validar o schema de atualização de status", () => {
    const validData = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      status: "done" as const,
    };
    const result = updateTaskStatusSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe("lib/validations/grades — gradeSchema", () => {
  it("deve validar nota entre 0 e 10", () => {
    const validGrade = {
      subject_id: "123e4567-e89b-12d3-a456-426614174000",
      title: "P1 de Física",
      value: 8.5,
      weight: 1.0,
    };
    const result = gradeSchema.safeParse(validGrade);
    expect(result.success).toBe(true);
  });

  it("deve rejeitar nota maior que 10", () => {
    const invalidGrade = {
      subject_id: "123e4567-e89b-12d3-a456-426614174000",
      title: "P1 de Física",
      value: 12.0,
      weight: 1.0,
    };
    const result = gradeSchema.safeParse(invalidGrade);
    expect(result.success).toBe(false);
  });
});
