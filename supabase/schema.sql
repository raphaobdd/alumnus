-- =============================================================
-- SISTEMA DE ORGANIZAÇÃO ACADÊMICA — Schema Principal
-- Aplicar no Supabase SQL Editor na ordem abaixo
-- =============================================================

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- FUNÇÃO UTILITÁRIA: atualiza updated_at automaticamente
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- TABELA: subjects (Matérias)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  code        TEXT CHECK (char_length(code) <= 20),         -- ex: "MAT101"
  professor   TEXT CHECK (char_length(professor) <= 100),
  workload    INTEGER CHECK (workload > 0),                  -- carga horária total (horas)
  max_absences INTEGER CHECK (max_absences >= 0),           -- máx de faltas antes de reprovar
  color       TEXT NOT NULL DEFAULT '#6366f1'               -- cor de identificação (hex)
               CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  semester    TEXT CHECK (char_length(semester) <= 20),     -- ex: "2025.1"
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);

DROP TRIGGER IF EXISTS trigger_subjects_updated_at ON public.subjects;
CREATE TRIGGER trigger_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- TABELA: grades (Notas / Avaliações)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.grades (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  value       NUMERIC(5,2) NOT NULL CHECK (value >= 0 AND value <= 10),
  weight      NUMERIC(5,2) NOT NULL DEFAULT 1 CHECK (weight > 0),
  period      TEXT CHECK (char_length(period) <= 50),       -- ex: "1º Bimestre"
  exam_date   DATE,
  notes       TEXT CHECK (char_length(notes) <= 500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grades_user_id     ON public.grades(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id  ON public.grades(subject_id);

DROP TRIGGER IF EXISTS trigger_grades_updated_at ON public.grades;
CREATE TRIGGER trigger_grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- TABELA: tasks (Tarefas / Entregas)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id  UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 150),
  description TEXT CHECK (char_length(description) <= 1000),
  due_date    TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'in_progress', 'done')),
  priority    TEXT NOT NULL DEFAULT 'medium'
               CHECK (priority IN ('low', 'medium', 'high')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id    ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_subject_id ON public.tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date   ON public.tasks(user_id, due_date);

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON public.tasks;
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- TABELA: attendance (Presenças / Faltas)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  present     BOOLEAN NOT NULL DEFAULT TRUE,
  notes       TEXT CHECK (char_length(notes) <= 200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, subject_id, date)               -- evita duplicata de registro por dia
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_id    ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON public.attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date       ON public.attendance(user_id, date);

DROP TRIGGER IF EXISTS trigger_attendance_updated_at ON public.attendance;
CREATE TRIGGER trigger_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- TABELA: schedule (Grade de Horários)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.schedule (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  weekday     SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),  -- 0=Dom, 1=Seg, ..., 6=Sáb
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL CHECK (end_time > start_time),
  room        TEXT CHECK (char_length(room) <= 50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_user_id    ON public.schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_subject_id ON public.schedule(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedule_weekday    ON public.schedule(user_id, weekday);

DROP TRIGGER IF EXISTS trigger_schedule_updated_at ON public.schedule;
CREATE TRIGGER trigger_schedule_updated_at
  BEFORE UPDATE ON public.schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- TABELA: audit_logs (Auditoria de Ações Críticas)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (char_length(action) <= 100),  -- ex: "DELETE_SUBJECT"
  entity      TEXT NOT NULL CHECK (char_length(entity) <= 50),   -- ex: "subjects"
  entity_id   UUID,
  metadata    JSONB,                                              -- dados extras (payload, IP, etc.)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =============================================================
-- TABELA: daily_reports (Relatórios Diários de Inteligência)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date      DATE NOT NULL,
  signals_snapshot JSONB NOT NULL,
  report_text      TEXT NOT NULL,
  risk_level       TEXT NOT NULL DEFAULT 'none' CHECK (risk_level IN ('none', 'attention', 'high')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_daily_report UNIQUE (user_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_user_date ON public.daily_reports(user_id, report_date DESC);

-- =============================================================
-- TABELA: important_dates (Calendário de Datas Importantes)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.important_dates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

DROP TRIGGER IF EXISTS trigger_important_dates_updated_at ON public.important_dates;
CREATE TRIGGER trigger_important_dates_updated_at
  BEFORE UPDATE ON public.important_dates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


