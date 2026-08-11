-- =============================================================
-- SISTEMA DE ORGANIZAÇÃO ACADÊMICA — Row Level Security (RLS)
-- Aplicar APÓS o schema.sql (Execução 100% Idempotente)
-- Cada tabela tem policies explícitas para SELECT/INSERT/UPDATE/DELETE
-- =============================================================

-- =============================================================
-- RLS: subjects
-- =============================================================
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects: users can select own rows" ON public.subjects;
CREATE POLICY "subjects: users can select own rows"
  ON public.subjects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subjects: users can insert own rows" ON public.subjects;
CREATE POLICY "subjects: users can insert own rows"
  ON public.subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subjects: users can update own rows" ON public.subjects;
CREATE POLICY "subjects: users can update own rows"
  ON public.subjects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subjects: users can delete own rows" ON public.subjects;
CREATE POLICY "subjects: users can delete own rows"
  ON public.subjects FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================
-- RLS: grades
-- =============================================================
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grades: users can select own rows" ON public.grades;
CREATE POLICY "grades: users can select own rows"
  ON public.grades FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "grades: users can insert own rows" ON public.grades;
CREATE POLICY "grades: users can insert own rows"
  ON public.grades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "grades: users can update own rows" ON public.grades;
CREATE POLICY "grades: users can update own rows"
  ON public.grades FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "grades: users can delete own rows" ON public.grades;
CREATE POLICY "grades: users can delete own rows"
  ON public.grades FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================
-- RLS: tasks
-- =============================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks: users can select own rows" ON public.tasks;
CREATE POLICY "tasks: users can select own rows"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks: users can insert own rows" ON public.tasks;
CREATE POLICY "tasks: users can insert own rows"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks: users can update own rows" ON public.tasks;
CREATE POLICY "tasks: users can update own rows"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks: users can delete own rows" ON public.tasks;
CREATE POLICY "tasks: users can delete own rows"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================
-- RLS: attendance
-- =============================================================
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance: users can select own rows" ON public.attendance;
CREATE POLICY "attendance: users can select own rows"
  ON public.attendance FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "attendance: users can insert own rows" ON public.attendance;
CREATE POLICY "attendance: users can insert own rows"
  ON public.attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "attendance: users can update own rows" ON public.attendance;
CREATE POLICY "attendance: users can update own rows"
  ON public.attendance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "attendance: users can delete own rows" ON public.attendance;
CREATE POLICY "attendance: users can delete own rows"
  ON public.attendance FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================
-- RLS: schedule
-- =============================================================
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedule: users can select own rows" ON public.schedule;
CREATE POLICY "schedule: users can select own rows"
  ON public.schedule FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "schedule: users can insert own rows" ON public.schedule;
CREATE POLICY "schedule: users can insert own rows"
  ON public.schedule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "schedule: users can update own rows" ON public.schedule;
CREATE POLICY "schedule: users can update own rows"
  ON public.schedule FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "schedule: users can delete own rows" ON public.schedule;
CREATE POLICY "schedule: users can delete own rows"
  ON public.schedule FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================
-- RLS: audit_logs
-- Usuários podem inserir seus próprios logs.
-- Nenhum usuário pode ler, atualizar ou deletar logs (imutáveis).
-- =============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs: users can insert own logs" ON public.audit_logs;
CREATE POLICY "audit_logs: users can insert own logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================
-- RLS: daily_reports
-- =============================================================
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

-- =============================================================
-- RLS: important_dates
-- =============================================================
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "important_dates: users manage their own dates" ON public.important_dates;
CREATE POLICY "important_dates: users manage their own dates"
  ON public.important_dates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
