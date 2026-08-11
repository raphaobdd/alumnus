import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const scheduleSchema = z
  .object({
    subject_id: z.string().optional().or(z.literal("")),
    subject_name: z
      .string()
      .min(1, "Digite o nome da matéria")
      .max(200, "Nome da matéria muito longo"),
    weekday: z
      .number()
      .int()
      .min(0, "Dia inválido")
      .max(6, "Dia inválido"),
    start_time: z
      .string()
      .regex(TIME_REGEX, "Horário de início inválido (use HH:MM)"),
    end_time: z
      .string()
      .regex(TIME_REGEX, "Horário de fim inválido (use HH:MM)"),
    room: z
      .string()
      .max(50, "Sala muito longa")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.start_time || !data.end_time) return true;
      return data.end_time > data.start_time;
    },
    {
      message: "Horário de fim deve ser após o início",
      path: ["end_time"],
    }
  );

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export type ScheduleInput = z.infer<typeof scheduleSchema>;
