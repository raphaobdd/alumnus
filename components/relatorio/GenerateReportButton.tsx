"use client";

import { useTransition } from "react";
import { generateTodayReportAction } from "@/app/actions/reports";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";

export function GenerateReportButton({ hasReportToday }: { hasReportToday: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateTodayReportAction();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(hasReportToday ? "Relatório diário atualizado!" : "Relatório diário gerado!");
      }
    });
  };

  return (
    <button
      id="generate-report-btn"
      className={hasReportToday ? "btn btn-secondary" : "btn btn-accent"}
      onClick={handleGenerate}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Calculando métricas...
        </>
      ) : (
        <>
          <RefreshCw size={16} />
          {hasReportToday ? "Atualizar Relatório do Dia" : "Gerar Relatório Diário Agora"}
        </>
      )}
    </button>
  );
}
