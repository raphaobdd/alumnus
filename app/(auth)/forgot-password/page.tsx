"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    startTransition(async () => {
      await forgotPasswordAction(data);
      // Sempre mostra sucesso (não revela se email existe)
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="animate-fade-in" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "var(--text-primary)" }}>
          Se o e-mail estiver cadastrado...
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
          Você receberá um link para redefinir sua senha. Verifique sua caixa de entrada e spam.
        </p>
        <Link href="/login" className="btn btn-secondary" style={{ display: "inline-flex" }}>
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
        Recuperar senha
      </h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ marginBottom: 20 }}>
          <label className="label" htmlFor="forgot-email">E-mail</label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="seu@email.com"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="error-message" role="alert">{errors.email.message}</p>}
        </div>

        <button
          id="forgot-submit"
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: "100%" }}
          disabled={isPending}
        >
          {isPending ? <><span className="spinner" /> Enviando...</> : "Enviar link de recuperação"}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "var(--text-secondary)" }}>
        <Link href="/login" style={{ color: "var(--primary)", fontWeight: 500, textDecoration: "none" }}>
          ← Voltar ao login
        </Link>
      </div>
    </div>
  );
}
