"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { subjectSchema, gradeSchema } from "@/lib/validations/grades";
import { logAuditEvent } from "@/lib/audit";
import type { ActionResult } from "./auth";
import type { Subject, Grade } from "@/types/database";

// ============================================================
// SUBJECTS (Matérias)
// ============================================================

export async function createSubjectAction(
  input: unknown
): Promise<ActionResult<Subject>> {
  const parsed = subjectSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data, error } = await supabase
    .from("subjects")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return { error: "Erro ao criar matéria." };

  revalidatePath("/notas");
  return { data };
}

export async function updateSubjectAction(
  id: string,
  input: unknown
): Promise<ActionResult<Subject>> {
  const parsed = subjectSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subjects")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: "Erro ao atualizar matéria." };

  revalidatePath("/notas");
  return { data };
}

export interface EvaluationItemInput {
  id?: string;
  title: string;
  value?: number;
  weight: number;
  exam_date?: string;
}

export interface UpdateSubjectPayload {
  subjectId: string;
  name: string;
  professor?: string;
  max_absences?: number;
  color?: string;
  evaluations: EvaluationItemInput[];
}

export async function updateSubjectWithEvaluationsAction(
  payload: UpdateSubjectPayload
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  if (!payload.name || payload.name.trim() === "") {
    return { error: "O nome da matéria é obrigatório." };
  }

  try {
    // 1. Atualizar Matéria
    const { error: subErr } = await supabase
      .from("subjects")
      .update({
        name: payload.name.trim(),
        professor: payload.professor?.trim() || null,
        max_absences: payload.max_absences || null,
        color: payload.color || "#1d4ed8",
      })
      .eq("id", payload.subjectId);

    if (subErr) return { error: "Erro ao atualizar a matéria." };

    // 2. Processar Avaliações e Inserção no Calendário
    for (const ev of payload.evaluations) {
      if (!ev.title || ev.title.trim() === "") continue;

      const rawWeight = ev.weight || 30;
      const decimalWeight = rawWeight > 1 ? rawWeight / 100 : rawWeight;
      const val = ev.value !== undefined && ev.value !== null ? Number(ev.value) : 0;
      const examDateStr = ev.exam_date || null;

      if (ev.id && !ev.id.startsWith("temp-")) {
        // Atualizar existente
        await supabase
          .from("grades")
          .update({
            title: ev.title.trim(),
            value: val,
            weight: decimalWeight,
            exam_date: examDateStr,
          })
          .eq("id", ev.id);
      } else {
        // Inserir nova avaliação
        await supabase.from("grades").insert({
          user_id: user.id,
          subject_id: payload.subjectId,
          title: ev.title.trim(),
          value: val,
          weight: decimalWeight,
          exam_date: examDateStr,
        });
      }

      // Sincronizar data no Calendário se houver exam_date
      if (examDateStr) {
        const pctText = `${(decimalWeight * 100).toFixed(0)}%`;
        await supabase.from("important_dates").insert({
          user_id: user.id,
          subject_id: payload.subjectId,
          title: `${payload.name} — ${ev.title.trim()}`,
          event_date: examDateStr,
          category: "prova",
          description: `Avaliação: ${ev.title.trim()} (${pctText} da nota final)`,
        });
      }
    }

    revalidatePath("/notas");
    revalidatePath(`/notas/${payload.subjectId}`);
    revalidatePath("/calendario");

    return {};
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar a matéria e avaliações.";
    return { error: msg };
  }
}

export async function deleteSubjectAction(
  id: string,
  subjectName: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("subjects").delete().eq("id", id);

  if (error) return { error: "Erro ao excluir matéria." };

  await logAuditEvent("DELETE_SUBJECT", "subjects", id, { name: subjectName });

  revalidatePath("/notas");
  return {};
}

// ============================================================
// GRADES (Notas / Avaliações)
// ============================================================

export async function createGradeAction(
  input: unknown
): Promise<ActionResult<Grade>> {
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const rawWeight = parsed.data.weight ?? 1;
  const decimalWeight = rawWeight > 1 ? rawWeight / 100 : rawWeight;

  const { data: createdGrade, error } = await supabase
    .from("grades")
    .insert({
      user_id: user.id,
      subject_id: parsed.data.subject_id,
      title: parsed.data.title,
      value: parsed.data.value,
      weight: decimalWeight,
      period: null,
      exam_date: parsed.data.exam_date || null,
      notes: parsed.data.notes || null,
    })
    .select()
    .single();

  if (error || !createdGrade) return { error: "Erro ao registrar nota." };

  if (parsed.data.exam_date) {
    const { data: sub } = await supabase
      .from("subjects")
      .select("name")
      .eq("id", parsed.data.subject_id)
      .single();

    const subjectName = sub?.name || "Matéria";
    const pctText = `${(decimalWeight * 100).toFixed(0)}%`;

    await supabase.from("important_dates").insert({
      user_id: user.id,
      subject_id: parsed.data.subject_id,
      title: `${subjectName} — ${parsed.data.title}`,
      event_date: parsed.data.exam_date,
      category: "prova",
      description: `Avaliação: ${parsed.data.title} (${pctText} da nota final)`,
    });

    revalidatePath("/calendario");
  }

  revalidatePath(`/notas/${parsed.data.subject_id}`);
  revalidatePath("/notas");
  return { data: createdGrade };
}

export async function updateGradeAction(
  id: string,
  input: unknown
): Promise<ActionResult<Grade>> {
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const supabase = await createClient();

  const rawWeight = parsed.data.weight ?? 1;
  const decimalWeight = rawWeight > 1 ? rawWeight / 100 : rawWeight;

  const { data, error } = await supabase
    .from("grades")
    .update({
      title: parsed.data.title,
      value: parsed.data.value,
      weight: decimalWeight,
      period: null,
      exam_date: parsed.data.exam_date || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: "Erro ao atualizar nota." };

  if (parsed.data.exam_date) {
    revalidatePath("/calendario");
  }

  revalidatePath(`/notas/${parsed.data.subject_id}`);
  revalidatePath("/notas");
  return { data };
}

export async function deleteGradeAction(
  id: string,
  subjectId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("grades").delete().eq("id", id);

  if (error) return { error: "Erro ao excluir nota." };

  await logAuditEvent("DELETE_GRADE", "grades", id);
  revalidatePath(`/notas/${subjectId}`);
  revalidatePath("/notas");
  return {};
}
