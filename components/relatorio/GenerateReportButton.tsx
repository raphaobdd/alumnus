"use client";

import { useTransition } from "react";
import { generateReportAction } from "@/app/actions/reports";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";

interface GenerateReportButtonProps {
  hasReport: boolean;
  periodType?: "daily" | "weekly" | "monthly";
}

export function GenerateReportButton({ hasReport, periodType = "daily" }: GenerateReportButtonProps) {
  const [isPending, startTransition] = useTransition();

  const periodLabel = periodType === "monthly" ? "Mensal" : periodType === "weekly" ? "Semanal" : "do Dia";

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateReportAction(periodType);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(hasReport ? `Relatório ${periodLabel} atualizado!` : `Relatório ${periodLabel} gerado!`);
      }
    });
  };

  return (
    <button
      id={`generate-report-btn-${periodType}`}
      className={hasReport ? "btn btn-secondary" : "btn btn-accent"}
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
          {hasReport ? `Atualizar Relatório ${periodLabel}` : `Gerar Relatório ${periodLabel}`}
        </>
      )}
    </button>
  );
}
