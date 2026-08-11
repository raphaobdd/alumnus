import { createClient } from "@/lib/supabase/server";

/**
 * Registra uma ação crítica na tabela audit_logs.
 * Usa o cliente server-side com a sessão do usuário atual.
 * O RLS garante que cada usuário só pode inserir seus próprios logs.
 */
export async function logAuditEvent(
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Explicit insert with each field typed to avoid never[] inference
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action,
      entity,
      entity_id: entityId ?? null,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
    });
  } catch (error) {
    // Falha no log não deve impedir a operação principal
    console.error("[audit] Erro ao registrar evento:", error);
  }
}
