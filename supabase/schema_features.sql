-- =============================================================
-- MIGRATION: Camada de Inteligência e Datas Importantes
-- Aplicar no Supabase SQL Editor (Execução 100% Segura e Idempotente)
-- =============================================================

-- 1. TABELA: daily_reports (Relatórios Diários de Inteligência)
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date      DATE NOT NULL,
  signals_snapshot JSONB NOT NULL,
  report_text      TEXT NOT NULL,
  risk_level       TEXT NOT NULL DEFAULT 'none' CHECK (risk_level IN ('none', 'attention', 'high')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_daily_report UNIQUE (user_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_user_date ON public.daily_reports(user_id, report_date DESC);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_reports: users can select own reports" ON public.daily_reports;
CREATE POLICY "daily_reports: users can select own reports"
  ON public.daily_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_reports: users can insert own reports" ON public.daily_reports;
CREATE POLICY "daily_reports: users can insert own reports"
  ON public.daily_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_reports: users can update own reports" ON public.daily_reports;
CREATE POLICY "daily_reports: users can update own reports"
  ON public.daily_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. TABELA: important_dates (Calendário de Datas Importantes)
CREATE TABLE IF NOT EXISTS public.important_dates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 150),
  description TEXT CHECK (char_length(description) <= 1000),
  event_date  DATE NOT NULL,
  category    TEXT NOT NULL DEFAULT 'outro' CHECK (category IN ('prova', 'entrega', 'evento', 'administrativo', 'outro')),
  subject_id  UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_important_dates_user_date ON public.important_dates(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_important_dates_subject   ON public.important_dates(subject_id);

-- Remover trigger anterior se existir e re-criar
DROP TRIGGER IF EXISTS trigger_important_dates_updated_at ON public.important_dates;

CREATE TRIGGER trigger_important_dates_updated_at
  BEFORE UPDATE ON public.important_dates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "important_dates: users manage their own dates" ON public.important_dates;
CREATE POLICY "important_dates: users manage their own dates"
  ON public.important_dates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
