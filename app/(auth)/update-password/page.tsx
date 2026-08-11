"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/lib/validations/auth";
import { updatePasswordAction } from "@/app/actions/auth";

export default function UpdatePasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = (data: UpdatePasswordInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updatePasswordAction(data);
      if (result?.error) setServerError(result.error);
    });
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
        Nova senha
      </h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 32 }}>
        Escolha uma senha forte para sua conta.
      </p>

      {serverError && (
        <div role="alert" style={{
          background: "var(--danger-light)", border: "1px solid var(--danger)",
          color: "var(--danger)", padding: "10px 14px", borderRadius: "var(--radius-sm)",
          fontSize: 13, marginBottom: 16
        }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ marginBottom: 16 }}>
          <label className="label" htmlFor="update-password">Nova senha</label>
          <input
            id="update-password"
            type="password"
            autoComplete="new-password"
            className="input"
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={!!errors.password}
          />
          {errors.password && <p className="error-message" role="alert">{errors.password.message}</p>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="label" htmlFor="update-confirm">Confirmar senha</label>
          <input
            id="update-confirm"
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
          id="update-password-submit"
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: "100%" }}
          disabled={isPending}
        >
          {isPending ? <><span className="spinner" /> Salvando...</> : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
