# Sistema de Organização Acadêmica

Sistema web multi-usuário para estudantes universitários organizarem notas, tarefas, presenças e rotina de aulas.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v3**
- **Supabase** (PostgreSQL + Auth + Realtime + RLS)
- **Zod** para validação de schemas
- **React Hook Form** com resolver Zod

## Setup Inicial

### 1. Clone e instale dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha com as chaves do seu projeto Supabase (veja seção abaixo).

### 3. Configure o Supabase

#### 3.1 Crie um projeto em [supabase.com](https://supabase.com)

#### 3.2 Aplique o schema SQL

No painel do Supabase, vá em **SQL Editor** e execute os arquivos **nesta ordem**:

1. `supabase/schema.sql` — cria tabelas, índices e triggers
2. `supabase/rls.sql` — habilita RLS e cria todas as policies

> ⚠️ Execute os arquivos separadamente. O `rls.sql` depende das tabelas do `schema.sql`.

#### 3.3 (Opcional) Dados de exemplo

Em `supabase/seed.sql`, substitua `'<SEU_USER_ID>'` pelo UUID do seu usuário de teste (encontrado em **Authentication → Users** no painel do Supabase) e execute o arquivo.

#### 3.4 Copie as chaves de API

No painel do Supabase, vá em **Settings → API**:

| Chave | Onde usar |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon/public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ **NUNCA** commite `.env.local` no Git. A `service_role` key dá acesso irrestrito ao banco — use-a apenas no servidor.

#### 3.5 Configure a URL de redirecionamento (Auth)

Em **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (dev) ou sua URL de produção
- **Redirect URLs**: adicione `http://localhost:3000/auth/callback`

### 4. Execute o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Estrutura do Projeto

```
/app
  /(auth)/login          → Página de login
  /(auth)/signup         → Cadastro de conta
  /(auth)/forgot-password → Recuperação de senha
  /(auth)/update-password → Redefinição de senha
  /(dashboard)/notas     → Módulo de notas e boletim
  /(dashboard)/tarefas   → Módulo de tarefas
  /(dashboard)/presencas → Módulo de presenças/faltas
  /(dashboard)/rotina    → Grade de horários semanal
  /auth/callback         → Callback OAuth/e-mail
/components
  /layout                → Sidebar, Header
  /ui                    → Componentes base (shadcn/ui)
  /notas                 → Componentes do módulo Notas
  /tarefas               → Componentes do módulo Tarefas
  /presencas             → Componentes do módulo Presenças
  /rotina                → Componentes do módulo Rotina
/lib
  /supabase              → client.ts, server.ts
  /validations           → schemas Zod
/app/actions             → Server Actions
/supabase                → schema.sql, rls.sql, seed.sql
/types                   → TypeScript types
```

## Segurança

- **RLS em todas as tabelas**: cada usuário acessa apenas seus próprios dados, garantido no banco de dados
- **Server Actions**: toda mutação passa pelo servidor — nunca executada apenas no client
- **Zod**: validação de schema em toda entrada de dados
- **Variáveis sensíveis**: `service_role` key apenas server-side (sem `NEXT_PUBLIC_` prefix)
- **Rate limiting**: middleware bloqueia abuso em endpoints de auth
- **Headers de segurança**: X-Frame-Options, Content-Type-Options, CSP e outros
- **Audit logs**: ações críticas (delete, mudança de senha) registradas na tabela `audit_logs`

## Scripts

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Linting com ESLint
```
