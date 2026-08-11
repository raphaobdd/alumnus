"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <div className="w-14 h-14 rounded-full bg-[var(--danger-light)] text-[var(--danger)] flex items-center justify-center mb-4">
        <AlertTriangle size={28} />
      </div>

      <h2 className="text-xl font-bold mb-2 text-[var(--text-primary)]">
        Algo deu errado ao carregar esta página
      </h2>
      <p className="text-sm text-[var(--text-muted)] max-w-md mb-6">
        {error.message || "Ocorreu um erro inesperado durante o carregamento dos dados acadêmicos."}
      </p>

      <button onClick={reset} className="btn btn-primary">
        <RefreshCw size={16} /> Tentar novamente
      </button>
    </div>
  );
}
