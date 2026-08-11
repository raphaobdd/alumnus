-- =============================================================
-- MIGRATION: Inteligência v2 - Múltiplas Granularidades de Relatório
-- Aplicar no Supabase SQL Editor (Execução 100% Segura e Idempotente)
-- =============================================================

-- 1. Adicionar coluna period_type em daily_reports caso não exista
ALTER TABLE public.daily_reports 
  ADD COLUMN IF NOT EXISTS period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily';

-- 2. Atualizar a constraint de unicidade para incluir period_type
ALTER TABLE public.daily_reports DROP CONSTRAINT IF EXISTS unique_user_daily_report;
ALTER TABLE public.daily_reports DROP CONSTRAINT IF EXISTS daily_reports_unique_period;

ALTER TABLE public.daily_reports 
  ADD CONSTRAINT daily_reports_unique_period UNIQUE (user_id, report_date, period_type);

-- 3. Atualizar índice de consulta por usuário, período e data
DROP INDEX IF EXISTS idx_daily_reports_user_date;
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_period_date 
  ON public.daily_reports(user_id, period_type, report_date DESC);
