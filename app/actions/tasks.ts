"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { taskSchema, updateTaskStatusSchema } from "@/lib/validations/tasks";
import { logAuditEvent } from "@/lib/audit";
import type { ActionResult } from "./auth";
import type { Task } from "@/types/database";

export async function createTaskAction(input: unknown): Promise<ActionResult<Task>> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  // Explicit insert to avoid type inference issues with optional/null fields
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      subject_id: parsed.data.subject_id || null,
      due_date: parsed.data.due_date || null,
      status: parsed.data.status ?? "pending",
      priority: parsed.data.priority ?? "medium",
    })
    .select()
    .single();

  if (error) return { error: "Erro ao criar tarefa." };

  revalidatePath("/tarefas");
  return { data };
}

export async function updateTaskAction(
  id: string,
  input: unknown
): Promise<ActionResult<Task>> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      subject_id: parsed.data.subject_id || null,
      due_date: parsed.data.due_date || null,
      status: parsed.data.status ?? "pending",
      priority: parsed.data.priority ?? "medium",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: "Erro ao atualizar tarefa." };

  revalidatePath("/tarefas");
  return { data };
}

export async function updateTaskStatusAction(
  input: unknown
): Promise<ActionResult<Task>> {
  const parsed = updateTaskStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select()
    .single();

  if (error) return { error: "Erro ao atualizar status." };

  revalidatePath("/tarefas");
  return { data };
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) return { error: "Erro ao excluir tarefa." };

  await logAuditEvent("DELETE_TASK", "tasks", id);
  revalidatePath("/tarefas");
  return {};
}
