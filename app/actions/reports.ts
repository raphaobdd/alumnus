"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateUserDailyReport } from "@/lib/intelligence/generator";
import type { ActionResult } from "./auth";
import type { DailyReport } from "@/types/database";

export async function generateTodayReportAction(): Promise<ActionResult<DailyReport>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  try {
    const report = await generateUserDailyReport(supabase, user.id);
    revalidatePath("/relatorio");
    return { data: report };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
    return { error: `Erro ao gerar relatório: ${errorMsg}` };
  }
}
