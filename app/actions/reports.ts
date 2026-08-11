"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateUserReport } from "@/lib/intelligence/generator";
import type { ActionResult } from "./auth";
import type { DailyReport } from "@/types/database";

export async function generateReportAction(
  periodType: "daily" | "weekly" | "monthly" = "daily"
): Promise<ActionResult<DailyReport>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  try {
    const report = await generateUserReport(supabase, user.id, periodType);
    revalidatePath("/relatorio");
    return { data: report };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
    return { error: `Erro ao gerar relatório (${periodType}): ${errorMsg}` };
  }
}

export async function generateTodayReportAction(): Promise<ActionResult<DailyReport>> {
  return generateReportAction("daily");
}
