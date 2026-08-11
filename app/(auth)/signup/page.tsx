"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { signupAction } from "@/app/actions/auth";
import { MailCheck, Check, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signupAction(data);
      if (result?.error) {
        setServerError(result.error);
      } else if (result?.data === null) {
        setSuccess(true);
      }
    });
  };

  if (success) {
    return (
      <div className="animate-fade-in" style={{ textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--accent-light)",
            color: "var(--accent)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <MailCheck size={32} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "var(--text-primary)" }}>
          Verifique seu e-mail
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
          Enviamos um link de confirmação para seu e-mail. Clique no link para ativar sua conta e começar a usar o AcadêmicoApp.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ display: "inline-flex" }}>
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .password-requirements {
          margin-top: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .req {
          font-size: 11px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .req-icon {
          width: 12px;
          height: 12px;
          color: var(--text-muted);
        }
      `}</style>

      <div className="animate-fade-in">
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
          Criar conta
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>
          Comece a organizar sua vida acadêmica gratuitamente
        </p>

        {serverError && (
          <div className="server-error" role="alert" style={{
            background: "var(--danger-light)", border: "1px solid var(--danger)",
            color: "var(--danger)", padding: "10px 14px", borderRadius: "var(--radius-sm)",
            fontSize: 13, marginBottom: 16
          }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label className="label" htmlFor="signup-name">Nome completo</label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              className="input"
              placeholder="Seu nome"
              {...register("fullName")}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <p className="error-message" role="alert">{errors.fullName.message}</p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label" htmlFor="signup-email">E-mail</label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              className="input"
              placeholder="seu@email.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="error-message" role="alert">{errors.email.message}</p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label" htmlFor="signup-password">Senha</label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              className="input"
              placeholder="••••••••"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password ? (
              <p className="error-message" role="alert">{errors.password.message}</p>
            ) : (
              <div className="password-requirements" aria-label="Requisitos da senha">
                <span className="req"><Check className="req-icon" /> Mínimo 8 caracteres</span>
                <span className="req"><Check className="req-icon" /> Uma letra maiúscula</span>
                <span className="req"><Check className="req-icon" /> Um número</span>
                <span className="req"><Check className="req-icon" /> Um caractere especial</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label" htmlFor="signup-confirm">Confirmar senha</label>
            <input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              className="input"
              placeholder="••••••••"
              {...register("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="error-message" role="alert">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%" }}
            disabled={isPending}
          >
            {isPending ? <><Loader2 size={18} className="animate-spin" /> Criando conta...</> : "Criar conta"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "var(--text-secondary)" }}>
          Já tem conta?{" "}
          <Link href="/login" style={{ color: "var(--primary)", fontWeight: 500, textDecoration: "none" }}>
            Entrar
          </Link>
        </div>
      </div>
    </>
  );
}
