"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { attendanceSchema } from "@/lib/validations/attendance";
import type { ActionResult } from "./auth";
import type { Attendance } from "@/types/database";

export async function upsertAttendanceAction(
  input: unknown
): Promise<ActionResult<Attendance>> {
  const parsed = attendanceSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // Upsert com constraint UNIQUE(user_id, subject_id, date)
  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        user_id: user.id,
        subject_id: parsed.data.subject_id,
        date: parsed.data.date,
        present: parsed.data.present,
        notes: parsed.data.notes || null,
      },
      { onConflict: "user_id,subject_id,date" }
    )
    .select()
    .single();

  if (error) return { error: "Erro ao registrar presença." };

  revalidatePath(`/presencas/${parsed.data.subject_id}`);
  revalidatePath("/presencas");
  return { data };
}

export async function deleteAttendanceAction(
  id: string,
  subjectId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("attendance").delete().eq("id", id);

  if (error) return { error: "Erro ao excluir registro de presença." };

  revalidatePath(`/presencas/${subjectId}`);
  revalidatePath("/presencas");
  return {};
}
