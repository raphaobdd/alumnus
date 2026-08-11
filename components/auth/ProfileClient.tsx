"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfileAction, exportUserDataAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { MfaSetupModal } from "@/components/auth/MfaSetupModal";
import { User, ShieldCheck, Download, Lock } from "lucide-react";

interface ProfileClientProps {
  userEmail: string;
  initialFullName: string;
}

export function ProfileClient({ userEmail, initialFullName }: ProfileClientProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [isMfaOpen, setIsMfaOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfileAction(fullName);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Perfil atualizado com sucesso!");
      }
    });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await exportUserDataAction();
      if (res.error || !res.data) {
        toast.error(res.error || "Erro ao exportar dados.");
        return;
      }

      const blob = new Blob([res.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `alumnus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Exportação concluída!");
    } catch {
      toast.error("Falha ao exportar dados acadêmicos.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Perfil & Configurações</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Gerencie suas informações pessoais, segurança e dados acadêmicos no Alumnus.
        </p>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={18} className="text-[var(--primary)]" /> Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <Input
              label="E-mail"
              value={userEmail}
              disabled
              readOnly
            />
            <Input
              label="Nome Completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isPending}>
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[var(--accent)]" /> Segurança da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-md bg-[var(--surface-2)]">
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Autenticação em Duas Etapas (MFA / 2FA)
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                Proteja sua conta utilizando um aplicativo autenticador (Google Authenticator, 1Password, etc).
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsMfaOpen(true)}>
              <Lock size={14} /> Configurar 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacidade e Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download size={18} className="text-[var(--info)]" /> Seus Dados Acadêmicos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Baixe uma cópia completa dos seus dados acadêmicos (matérias, notas, presenças, tarefas e rotinas) em formato JSON estruturado.
          </p>
          <div>
            <Button variant="outline" onClick={handleExportData} isLoading={isExporting}>
              <Download size={16} /> Exportar Dados (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>

      <MfaSetupModal isOpen={isMfaOpen} onClose={() => setIsMfaOpen(false)} />
    </div>
  );
}
