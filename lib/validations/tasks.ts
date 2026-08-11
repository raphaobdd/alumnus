import { z } from "zod";

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(150, "Título muito longo"),
  description: z
    .string()
    .max(1000, "Descrição muito longa")
    .optional()
    .or(z.literal("")),
  subject_id: z
    .string()
    .uuid("Matéria inválida")
    .optional()
    .or(z.literal("")),
  due_date: z
    .string()
    .optional()
    .or(z.literal("")),
  status: z.enum(["pending", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export const updateTaskStatusSchema = z.object({
  id: z.string().uuid("ID inválido"),
  status: z.enum(["pending", "in_progress", "done"]),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
