"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/app/actions/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(data);
      if (result?.error) setServerError(result.error);
    });
  };

  return (
    <>
      <style>{`
        .auth-form-title {
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .auth-form-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 32px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .server-error {
          background: var(--danger-light);
          border: 1px solid var(--danger);
          color: var(--danger);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          margin-bottom: 16px;
          animation: fade-in 0.2s ease;
        }
        .auth-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .auth-footer a {
          color: var(--primary);
          font-weight: 500;
          text-decoration: none;
        }
        .auth-footer a:hover {
          text-decoration: underline;
        }
        .forgot-link {
          display: block;
          text-align: right;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
          text-decoration: none;
        }
        .forgot-link:hover {
          color: var(--primary);
        }
      `}</style>

      <div className="animate-fade-in">
        <h2 className="auth-form-title">Bem-vindo de volta</h2>
        <p className="auth-form-subtitle">Entre na sua conta para continuar</p>

        {serverError && (
          <div className="server-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="label" htmlFor="login-email">
              E-mail
            </label>
            <input
              id="login-email"
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

          <div className="form-group">
            <label className="label" htmlFor="login-password">
              Senha
            </label>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="error-message" role="alert">{errors.password.message}</p>
            )}
            <Link href="/forgot-password" className="forgot-link">
              Esqueci minha senha
            </Link>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: "8px" }}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Não tem conta?{" "}
          <Link href="/signup">Criar conta gratuita</Link>
        </div>
      </div>
    </>
  );
}
