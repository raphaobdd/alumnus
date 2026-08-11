"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { importantDateSchema } from "@/lib/validations/important_dates";
import { logAuditEvent } from "@/lib/audit";
import type { ActionResult } from "./auth";
import type { ImportantDate } from "@/types/database";

export async function createImportantDateAction(
  input: unknown
): Promise<ActionResult<ImportantDate>> {
  const parsed = importantDateSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data, error } = await supabase
    .from("important_dates")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      event_date: parsed.data.event_date,
      category: parsed.data.category,
      subject_id: parsed.data.subject_id || null,
    })
    .select()
    .single();

  if (error) return { error: "Erro ao criar data importante." };

  revalidatePath("/calendario");
  revalidatePath("/relatorio");
  return { data };
}

export async function updateImportantDateAction(
  id: string,
  input: unknown
): Promise<ActionResult<ImportantDate>> {
  const parsed = importantDateSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("important_dates")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      event_date: parsed.data.event_date,
      category: parsed.data.category,
      subject_id: parsed.data.subject_id || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: "Erro ao atualizar data importante." };

  revalidatePath("/calendario");
  revalidatePath("/relatorio");
  return { data };
}

export async function deleteImportantDateAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("important_dates").delete().eq("id", id);

  if (error) return { error: "Erro ao excluir data importante." };

  await logAuditEvent("DELETE_IMPORTANT_DATE", "important_dates", id);
  revalidatePath("/calendario");
  revalidatePath("/relatorio");
  return {};
}
