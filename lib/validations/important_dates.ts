import { z } from "zod";

export const importantDateCategoryEnum = z.enum([
  "prova",
  "entrega",
  "evento",
  "administrativo",
  "outro",
]);

export const importantDateSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(150, "Título deve ter no máximo 150 caracteres"),
  description: z
    .string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional()
    .or(z.literal("")),
  event_date: z
    .string()
    .min(1, "Data é obrigatória")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD"),
  category: importantDateCategoryEnum,
  subject_id: z
    .string()
    .uuid("Matéria inválida")
    .optional()
    .or(z.literal("")),
});

export type ImportantDateInput = z.input<typeof importantDateSchema>;
