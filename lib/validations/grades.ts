import { z } from "zod";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export const subjectSchema = z.object({
  name: z
    .string()
    .min(1, "Nome da matéria é obrigatório")
    .max(100, "Nome muito longo"),
  code: z.string().max(20, "Código muito longo").optional().or(z.literal("")),
  professor: z
    .string()
    .max(100, "Nome do professor muito longo")
    .optional()
    .or(z.literal("")),
  workload: z
    .number()
    .int("Deve ser número inteiro")
    .positive("Carga horária deve ser positiva")
    .optional(),
  max_absences: z
    .number()
    .int("Deve ser número inteiro")
    .min(0, "Não pode ser negativo")
    .optional(),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, "Cor deve ser um código hex válido (#RRGGBB)")
    .optional(),
  semester: z.string().max(20, "Semestre muito longo").optional().or(z.literal("")),
});

export const gradeSchema = z.object({
  subject_id: z.string().uuid("Matéria inválida"),
  title: z
    .string()
    .min(1, "Título da avaliação é obrigatório")
    .max(100, "Título muito longo"),
  value: z
    .number()
    .min(0, "Nota não pode ser negativa")
    .max(10, "Nota máxima é 10"),
  weight: z
    .number()
    .positive("Porcentagem deve ser positiva")
    .max(100, "Porcentagem máxima é 100%")
    .optional(),
  period: z.string().max(50, "Período muito longo").optional().or(z.literal("")),
  exam_date: z.string().date("Data inválida").optional().or(z.literal("")),
  notes: z.string().max(500, "Observações muito longas").optional().or(z.literal("")),
});

export type SubjectInput = z.infer<typeof subjectSchema>;
export type GradeInput = z.infer<typeof gradeSchema>;
