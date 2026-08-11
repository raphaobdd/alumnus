import { z } from "zod";

// ============================================================
// Auth Schemas
// ============================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido")
    .max(254, "E-mail muito longo"),
  password: z.string().min(1, "Senha é obrigatória").max(72, "Senha muito longa"),
});

export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, "E-mail é obrigatório")
      .email("E-mail inválido")
      .max(254, "E-mail muito longo"),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .max(72, "Senha muito longa")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número")
      .regex(
        /[^A-Za-z0-9]/,
        "A senha deve conter pelo menos um caractere especial"
      ),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
    fullName: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo")
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido")
    .max(254, "E-mail muito longo"),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .max(72, "Senha muito longa")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número")
      .regex(
        /[^A-Za-z0-9]/,
        "A senha deve conter pelo menos um caractere especial"
      ),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
