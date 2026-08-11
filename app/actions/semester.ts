"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateUserDailyReport } from "@/lib/intelligence/generator";
import type { ActionResult } from "./auth";

export interface SemesterScheduleItem {
  weekday: number;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface SemesterSubjectItem {
  name: string;
  code?: string;
  professor?: string;
  workload?: number;
  max_absences?: number;
  color: string;
  schedules: SemesterScheduleItem[];
}

export interface SemesterSetupPayload {
  semesterName: string;
  startDate?: string;
  endDate?: string;
  subjects: SemesterSubjectItem[];
}

export async function createSemesterSetupAction(
  payload: SemesterSetupPayload
): Promise<ActionResult> {
  if (!payload.semesterName || payload.semesterName.trim() === "") {
    return { error: "Informe o nome do semestre (ex: 2026.1)." };
  }

  if (!payload.subjects || payload.subjects.length === 0) {
    return { error: "Adicione pelo menos uma matéria ao semestre." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  try {
    const semName = payload.semesterName.trim();

    for (const sub of payload.subjects) {
      if (!sub.name || sub.name.trim() === "") continue;

      // 1. Inserir matéria do semestre
      const { data: createdSubject, error: subError } = await supabase
        .from("subjects")
        .insert({
          user_id: user.id,
          name: sub.name.trim(),
          code: sub.code?.trim() || null,
          semester: semName,
          professor: sub.professor?.trim() || null,
          workload: sub.workload || null,
          max_absences: sub.max_absences || null,
          color: sub.color || "#1d4ed8",
        })
        .select("id")
        .single();

      if (subError || !createdSubject) {
        console.error("Erro ao criar matéria do semestre:", subError);
        continue;
      }

      // 2. Inserir aulas na grade
      if (sub.schedules && sub.schedules.length > 0) {
        const scheduleRows = sub.schedules.map((sched) => ({
          user_id: user.id,
          subject_id: createdSubject.id,
          weekday: sched.weekday,
          start_time: sched.start_time,
          end_time: sched.end_time,
          room: sched.room?.trim() || null,
        }));

        await supabase.from("schedule").insert(scheduleRows);
      }
    }

    // 3. Inserir marcos de início e fim do semestre no calendário
    if (payload.startDate) {
      await supabase.from("important_dates").insert({
        user_id: user.id,
        title: `Início das Aulas — Semestre ${semName}`,
        event_date: payload.startDate,
        category: "administrativo",
        description: `Início oficial do semestre acadêmico ${semName}`,
      });
    }

    if (payload.endDate) {
      await supabase.from("important_dates").insert({
        user_id: user.id,
        title: `Término das Aulas — Semestre ${semName}`,
        event_date: payload.endDate,
        category: "administrativo",
        description: `Encerramento oficial do semestre acadêmico ${semName}`,
      });
    }

    // 4. Gerar relatório diário completo com o motor de inteligência
    try {
      await generateUserDailyReport(supabase, user.id);
    } catch (e) {
      console.error("Aviso ao gerar relatório de inteligência:", e);
    }

    // 5. Revalidar caminhos
    revalidatePath("/rotina");
    revalidatePath("/notas");
    revalidatePath("/presencas");
    revalidatePath("/calendario");
    revalidatePath("/relatorio");

    return {};
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao cadastrar semestre.";
    return { error: msg };
  }
}
