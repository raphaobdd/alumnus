-- =============================================================
-- SISTEMA DE ORGANIZAÇÃO ACADÊMICA — Seed Data (Dados de Exemplo)
-- Aplicar APÓS schema.sql e rls.sql
-- IMPORTANTE: Substitua '<SEU_USER_ID>' pelo UUID do usuário de teste
-- Obtenha em: Supabase → Authentication → Users → copie o UUID
-- =============================================================

-- Substitua este valor pelo UUID real do seu usuário de teste:
DO $$
DECLARE
  test_user_id UUID := '<SEU_USER_ID>';
  sub1_id UUID := uuid_generate_v4();
  sub2_id UUID := uuid_generate_v4();
  sub3_id UUID := uuid_generate_v4();
  sub4_id UUID := uuid_generate_v4();
BEGIN

-- Matérias
INSERT INTO public.subjects (id, user_id, name, code, professor, workload, max_absences, color, semester) VALUES
  (sub1_id, test_user_id, 'Cálculo I',         'MAT101', 'Prof. Silva',   60, 15, '#6366f1', '2025.1'),
  (sub2_id, test_user_id, 'Programação OO',     'INF202', 'Prof. Costa',   60, 15, '#10b981', '2025.1'),
  (sub3_id, test_user_id, 'Banco de Dados',     'INF305', 'Prof. Mendes',  45, 11, '#f59e0b', '2025.1'),
  (sub4_id, test_user_id, 'Engenharia de Software', 'INF401', 'Prof. Lima', 60, 15, '#ef4444', '2025.1');

-- Notas
INSERT INTO public.grades (user_id, subject_id, title, value, weight, period) VALUES
  (test_user_id, sub1_id, 'Prova 1',     7.5, 2, '1º Bimestre'),
  (test_user_id, sub1_id, 'Prova 2',     6.0, 2, '2º Bimestre'),
  (test_user_id, sub1_id, 'Trabalho',    8.5, 1, '1º Bimestre'),
  (test_user_id, sub2_id, 'Projeto Final', 9.0, 3, 'Final'),
  (test_user_id, sub2_id, 'Prova',       7.0, 2, '1º Bimestre'),
  (test_user_id, sub3_id, 'Prova 1',     5.5, 2, '1º Bimestre'),
  (test_user_id, sub4_id, 'Seminário',   8.0, 1, '1º Bimestre');

-- Tarefas
INSERT INTO public.tasks (user_id, subject_id, title, description, due_date, status, priority) VALUES
  (test_user_id, sub2_id, 'Implementar CRUD de usuários', 'Usar padrão Repository', NOW() + INTERVAL '2 days', 'in_progress', 'high'),
  (test_user_id, sub3_id, 'Modelagem ER do sistema', 'Entregar diagrama em PDF', NOW() + INTERVAL '5 days', 'pending', 'medium'),
  (test_user_id, sub1_id, 'Lista de exercícios cap.3', NULL, NOW() + INTERVAL '1 day', 'pending', 'high'),
  (test_user_id, sub4_id, 'Documento de requisitos', 'IEEE 830', NOW() + INTERVAL '10 days', 'pending', 'low'),
  (test_user_id, NULL,    'Revisar para a prova de Cálculo', NULL, NOW() + INTERVAL '3 days', 'pending', 'medium');

-- Presenças
INSERT INTO public.attendance (user_id, subject_id, date, present) VALUES
  (test_user_id, sub1_id, CURRENT_DATE - 14, TRUE),
  (test_user_id, sub1_id, CURRENT_DATE - 7,  TRUE),
  (test_user_id, sub1_id, CURRENT_DATE,       FALSE),
  (test_user_id, sub2_id, CURRENT_DATE - 14, TRUE),
  (test_user_id, sub2_id, CURRENT_DATE - 7,  TRUE),
  (test_user_id, sub2_id, CURRENT_DATE,       TRUE),
  (test_user_id, sub3_id, CURRENT_DATE - 14, FALSE),
  (test_user_id, sub3_id, CURRENT_DATE - 7,  FALSE),
  (test_user_id, sub3_id, CURRENT_DATE,       TRUE);

-- Horários
INSERT INTO public.schedule (user_id, subject_id, weekday, start_time, end_time, room) VALUES
  (test_user_id, sub1_id, 1, '08:00', '10:00', 'Sala 201'),  -- Segunda
  (test_user_id, sub1_id, 3, '08:00', '10:00', 'Sala 201'),  -- Quarta
  (test_user_id, sub2_id, 1, '10:00', '12:00', 'Lab 3'),     -- Segunda
  (test_user_id, sub2_id, 4, '10:00', '12:00', 'Lab 3'),     -- Quinta
  (test_user_id, sub3_id, 2, '14:00', '16:00', 'Sala 105'),  -- Terça
  (test_user_id, sub3_id, 5, '14:00', '16:00', 'Sala 105'),  -- Sexta
  (test_user_id, sub4_id, 3, '14:00', '17:00', 'Sala 302');  -- Quarta

END $$;
