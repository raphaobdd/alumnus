"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, ShieldAlert, KeyRound, Loader2, X, Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface MfaFactor {
  id: string;
  status: "verified" | "unverified";
  factor_type: string;
}

export function MfaSetupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const supabase = createClient();

  const loadFactors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data?.totp as MfaFactor[] || []);
    } catch (err: unknown) {
      console.error("Erro ao carregar fatores MFA:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFactors();
    }
  }, [isOpen]);

  const verifiedFactor = factors.find((f) => f.status === "verified");

  const startEnrollment = async () => {
    setEnrolling(true);
    setQrCodeSvg(null);
    setSecret(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Alumnus Acadêmico",
      });
      if (error) throw error;

      setFactorId(data.id);
      setQrCodeSvg(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar MFA";
      toast.error(msg);
    } finally {
      setEnrolling(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!factorId || verificationCode.length !== 6) {
      toast.error("Insira o código de 6 dígitos do seu aplicativo autenticador.");
      return;
    }

    setVerifying(true);
    try {
      const challengeRes = await supabase.auth.mfa.challenge({ factorId });
      if (challengeRes.error) throw challengeRes.error;

      const verifyRes = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeRes.data.id,
        code: verificationCode,
      });
      if (verifyRes.error) throw verifyRes.error;

      toast.success("Autenticação em Duas Etapas (2FA/MFA) ativada com sucesso!");
      setQrCodeSvg(null);
      setSecret(null);
      setVerificationCode("");
      await loadFactors();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código de verificação inválido";
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const disableMfa = async (id: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (error) throw error;
      toast.success("Autenticação em Duas Etapas (2FA/MFA) desativada.");
      await loadFactors();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao desativar MFA";
      toast.error(msg);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success("Chave secreta copiada!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="modal-content" style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 10, color: "var(--text-primary)" }}>
            <KeyRound size={20} className="text-accent" />
            Segurança & Autenticação em 2 Etapas (MFA)
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 10px" }} />
            Carregando configurações de segurança...
          </div>
        ) : verifiedFactor ? (
          <div>
            <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: "var(--radius-sm)", padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--accent)", fontWeight: 700, marginBottom: 6 }}>
                <ShieldCheck size={22} />
                <span>2FA / MFA Ativo e Protegido</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
                Sua conta está protegida com autenticação em duas etapas por aplicativo autenticador (TOTP).
              </p>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: "100%", color: "var(--danger)", borderColor: "var(--danger)" }}
              onClick={() => disableMfa(verifiedFactor.id)}
            >
              Desativar 2FA / MFA nesta conta
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
              Adicione uma camada extra de proteção à sua conta usando aplicativos como Google Authenticator, Authy ou Bitwarden.
            </p>

            {!qrCodeSvg ? (
              <button
                className="btn btn-accent"
                style={{ width: "100%" }}
                onClick={startEnrollment}
                disabled={enrolling}
              >
                {enrolling ? <><Loader2 size={16} className="animate-spin" /> Gerando QR Code...</> : "Ativar 2FA (TOTP)"}
              </button>
            ) : (
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, textAlign: "center", color: "var(--text-primary)" }}>
                  1. Escaneie o QR Code no seu aplicativo autenticador
                </h4>

                <div
                  style={{
                    background: "#fff",
                    padding: 12,
                    borderRadius: 8,
                    width: 180,
                    height: 180,
                    margin: "0 auto 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                />

                {secret && (
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                      Chave de configuração manual:
                    </p>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface)", padding: "6px 12px", borderRadius: 4, border: "1px solid var(--border)", fontSize: 12, fontFamily: "monospace" }}>
                      <span>{secret}</span>
                      <button onClick={copySecret} title="Copiar chave" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)" }}>
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
                  2. Insira o código de 6 dígitos gerado:
                </h4>

                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <input
                    type="text"
                    className="input"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    style={{ textAlign: "center", letterSpacing: "0.2em", fontSize: 18, fontWeight: 700 }}
                  />
                  <button
                    className="btn btn-accent"
                    onClick={verifyAndEnable}
                    disabled={verifying || verificationCode.length !== 6}
                  >
                    {verifying ? <Loader2 size={16} className="animate-spin" /> : "Confirmar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--border)", textAlign: "right" }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
