"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
  type LoginInput,
  type SignupInput,
  type ForgotPasswordInput,
  type UpdatePasswordInput,
} from "@/lib/validations/auth";
import { logAuditEvent } from "@/lib/audit";

// Tipo de retorno padronizado para Server Actions
export type ActionResult<T = null> = {
  data?: T;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

// ============================================================
// LOGIN
// ============================================================
export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Mensagem genérica — não revela se email existe ou não
    return { error: "E-mail ou senha inválidos." };
  }

  revalidatePath("/", "layout");
  redirect("/notas");
}

// ============================================================
// SIGNUP
// ============================================================
export async function signupAction(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("User already registered")) {
      // Mensagem genérica — não revela que email existe
      return {
        error:
          "Se esse e-mail não estiver cadastrado, você receberá um link de confirmação.",
      };
    }
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  return {
    data: null,
    // Sem redirect — usuário precisa confirmar o e-mail
  };
}

// ============================================================
// LOGOUT
// ============================================================
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// ============================================================
// FORGOT PASSWORD
// ============================================================
export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
    }
  );

  if (error) {
    // Sempre retorna sucesso — não revela se email existe
    console.error("[auth] resetPasswordForEmail error:", error);
  }

  // Mesmo se der erro, retorna "sucesso" por segurança
  return { data: null };
}

// ============================================================
// UPDATE PASSWORD
// ============================================================
export async function updatePasswordAction(
  input: UpdatePasswordInput
): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Erro ao atualizar senha. O link pode ter expirado." };
  }

  // Log de auditoria para mudança de senha
  await logAuditEvent("CHANGE_PASSWORD", "auth.users");

  revalidatePath("/", "layout");
  redirect("/notas");
}
