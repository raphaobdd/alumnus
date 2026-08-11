import { z } from "zod";

export const attendanceSchema = z.object({
  subject_id: z.string().uuid("Matéria inválida"),
  date: z.string().date("Data inválida"),
  present: z.boolean().default(true),
  notes: z
    .string()
    .max(200, "Observação muito longa")
    .optional()
    .or(z.literal("")),
});

export const bulkAttendanceSchema = z.object({
  subject_id: z.string().uuid("Matéria inválida"),
  records: z.array(
    z.object({
      date: z.string().date("Data inválida"),
      present: z.boolean(),
    })
  ).min(1, "Pelo menos um registro é necessário"),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
