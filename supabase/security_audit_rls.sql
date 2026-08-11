-- =============================================================
-- SCRIPT DE AUDITORIA E VERIFICAÇÃO DE RLS (SUPABASE SQL EDITOR)
-- Executar este script para listar e validar o status de RLS e Políticas
-- =============================================================

-- 1. Verificar se RLS está habilitado em todas as tabelas public
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Listar todas as políticas ativas por tabela e operação (SELECT, INSERT, UPDATE, DELETE)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
