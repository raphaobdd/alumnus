"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { scheduleSchema } from "@/lib/validations/schedule";
import type { ActionResult } from "./auth";
import type { Database, Schedule } from "@/types/database";

const SUBJECT_COLORS = [
  "#1d4ed8", // Executive Blue
  "#059669", // Emerald Green
  "#0284c7", // Sky Blue
  "#7c3aed", // Violet
  "#d97706", // Amber
  "#0d9488", // Teal
  "#db2777", // Pink
];

async function resolveSubjectId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  subjectName: string
): Promise<string> {
  const trimmedName = subjectName.trim();

  // 1. Tentar encontrar matéria existente pelo nome (case-insensitive)
  const { data: existingSubjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("user_id", userId);

  const matched = (existingSubjects ?? []).find(
    (s) => s.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );

  if (matched) {
    return matched.id;
  }

  // 2. Se não existir, criar automaticamente a matéria com cor da paleta
  const randomColor = SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];
  const { data: newSubject, error: createError } = await supabase
    .from("subjects")
    .insert({
      user_id: userId,
      name: trimmedName,
      color: randomColor,
    })
    .select("id")
    .single();

  if (createError || !newSubject) {
    throw new Error("Erro ao cadastrar matéria automaticamente.");
  }

  return newSubject.id;
}

export async function createScheduleAction(
  input: unknown
): Promise<ActionResult<Schedule>> {
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  try {
    const subjectId = await resolveSubjectId(supabase, user.id, parsed.data.subject_name);

    const { data, error } = await supabase
      .from("schedule")
      .insert({
        user_id: user.id,
        subject_id: subjectId,
        weekday: parsed.data.weekday,
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time,
        room: parsed.data.room || null,
      })
      .select()
      .single();

    if (error) return { error: "Erro ao adicionar horário." };

    revalidatePath("/rotina");
    revalidatePath("/notas");
    revalidatePath("/presencas");
    return { data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao processar matéria.";
    return { error: msg };
  }
}

export async function updateScheduleAction(
  id: string,
  input: unknown
): Promise<ActionResult<Schedule>> {
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  try {
    const subjectId = await resolveSubjectId(supabase, user.id, parsed.data.subject_name);

    const { data, error } = await supabase
      .from("schedule")
      .update({
        subject_id: subjectId,
        weekday: parsed.data.weekday,
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time,
        room: parsed.data.room || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { error: "Erro ao atualizar horário." };

    revalidatePath("/rotina");
    return { data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao processar matéria.";
    return { error: msg };
  }
}

export async function moveScheduleAction(
  id: string,
  newWeekday: number,
  newStartTime?: string,
  newEndTime?: string
): Promise<ActionResult<Schedule>> {
  if (newWeekday < 0 || newWeekday > 6) {
    return { error: "Dia da semana inválido." };
  }

  const supabase = await createClient();

  const updatePayload: Database["public"]["Tables"]["schedule"]["Update"] = {
    weekday: newWeekday,
    ...(newStartTime ? { start_time: newStartTime } : {}),
    ...(newEndTime ? { end_time: newEndTime } : {}),
  };

  const { data, error } = await supabase
    .from("schedule")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: "Erro ao mover horário." };

  revalidatePath("/rotina");
  return { data };
}

export async function deleteScheduleAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("schedule").delete().eq("id", id);

  if (error) return { error: "Erro ao excluir horário." };

  revalidatePath("/rotina");
  return {};
}
