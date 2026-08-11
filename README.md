# 🎓 Alumnus — Plataforma de Gestão e Inteligência Acadêmica

> **Alumnus** é uma solução web moderna, inteligente e de alto desempenho projetada para estudantes universitários organizarem notas, presenças, tarefas, grade semanal e calendário acadêmico em um só lugar.

---

## 🚀 Principais Funcionalidades

### 🪄 Assistente de Semestre Completo (Wizard em 3 Passos)
- **Passo 1 — Período**: Configuração do semestre (ex: `2026.1`) e datas oficiais de início e término das aulas.
- **Passo 2 — Matérias**: Inserção manual e personalização de disciplinas (Professor, Limite de Faltas e Cor).
- **Passo 3 — Grade Horária**: Organização dos horários semanais com salvamento unificado em 1 clique.

### 🧠 Relatório Diário de Inteligência
- Geração diária de diagnósticos acadêmicos com recomendações de estudo.
- Notificações de incentivo e alertas como: *"Ajuste seu calendário! Se organize antes das suas aulas voltarem."*

### 📊 Gestão de Notas & Boletim
- Divisão de avaliações configurável em **Porcentagem (%)** (ex: *Prova 1: 30%*, *Prova 2: 35%*, *Trabalho: 35%* = `100%`).
- Conversão decimal automática para cálculo de média ponderada exata (`0.3`, `0.35`, `0.35`).
- **Sincronização com o Calendário**: Ao salvar uma prova ou entrega com data, o evento é cadastrado automaticamente no Calendário.

### 🎯 Tarefas com Prioridade 100% Automática
- **Vínculo com Avaliações**: Associe tarefas diretamente à parte da nota da matéria.
- **Prioridade Inteligente**: Calculada automaticamente em tempo real combinando o prazo de entrega e o peso da nota:
  - 🔥 **Alta**: Entrega em menos de 48h ou avaliação $\ge 30\%$ da nota.
  - ⚡ **Média**: Entrega nesta semana (até 7 dias) ou avaliação $\ge 15\%$ da nota.
  - 🌱 **Baixa**: Prazos distantes sem peso elevado.

### 📅 Calendário Unificado & Controle de Presenças
- **Filtro de Aulas do Dia**: Ao selecionar uma data, o calendário exibe apenas as matérias com aula agendada para aquele dia da semana.
- **Presença Padrão em Aulas Sem Chamada**: Aulas marcadas como *"Sem chamada"* mantêm a presença computada por padrão ($100\%$ de frequência), sem penalizar o aluno.
- **Indicador de Porcentagem de Frequência (%)**: Barra visual com cores indicativas (Verde $\ge 75\%$, Amarelo $< 75\%$, Vermelho $< 70\%$).

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Framework Web** | Next.js 16 (App Router + Turbopack) |
| **Linguagem** | TypeScript 5 |
| **Interface & Estilos** | Vanilla CSS (Tokens HSL, Dark Mode, Glassmorphism) + Lucide Icons |
| **Backend & Banco** | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| **Formulários & Schemas** | React Hook Form + Zod |
| **Notificações** | Sonner Toast |

---

## 📦 Instalação e Execução Local

### 1. Clonar o repositório e instalar dependências

```bash
git clone https://github.com/raphaobdd/alumnus.git
cd alumnus
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha as variáveis de ambiente com as credenciais do seu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

> ⚠️ **Segurança:** O arquivo `.env.example` é o único versionado no Git (`.gitignore`). Nunca commite `.env.local`.

### 3. Configurar o Banco de Dados (Supabase)

No painel do Supabase em **SQL Editor**, execute os scripts SQL localizados na pasta `/supabase` na seguinte ordem:

1. `supabase/schema.sql` — Criação das tabelas fundamentais e índices.
2. `supabase/rls.sql` — Habilitação de Row Level Security (RLS) e políticas de acesso.
3. `supabase/schema_features.sql` — Funcionalidades adicionais (relatórios diários de inteligência e audit logs).

### 4. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse a aplicação em **`http://localhost:3000`**.

---

## 📂 Estrutura de Pastas

```text
projeto_alunos/
├── app/
│   ├── (auth)/                # Telas de Login, Cadastro e Recuperação de Senha
│   ├── (dashboard)/           # Módulos principais (Notas, Tarefas, Presenças, Rotina, Calendário, Relatório)
│   ├── actions/               # Server Actions para mutação de dados
│   ├── api/                   # Handlers de API e cron jobs
│   └── layout.tsx             # Layout raiz e metadados globais
├── components/
│   ├── calendario/            # Componentes do Calendário de eventos
│   ├── layout/                # Sidebar e Header de navegação
│   ├── notas/                 # Módulo de Notas, Boletim e Cadastro de Avaliações
│   ├── presencas/             # Calendário Unificado e Consulta de Frequência (%)
│   ├── relatorio/             # Relatório de Inteligência Acadêmica
│   ├── rotina/                # Grade semanal de horários interativa
│   ├── semestre/              # Assistente de Cadastro de Semestre Completo
│   └── tarefas/               # Quadro de Tarefas e Calculadora de Prioridade
├── lib/
│   ├── intelligence/          # Motor de inteligência e diagnóstico diário
│   ├── supabase/              # Clientes de conexão Supabase (SSR & Browser)
│   └── validations/           # Schemas de validação Zod
├── supabase/                  # Scripts SQL (schema, rls, seed, features)
└── types/                     # Interfaces TypeScript derivadas do banco
```

---

## 🛡️ Segurança e Boas Práticas

- **Row Level Security (RLS)**: Todas as tabelas no PostgreSQL possuem políticas ativas garantindo isolamento total entre usuários.
- **Server Actions Scoped**: Operações no banco são executadas no servidor com verificação de sessão autenticada.
- **Validação Estrita de Schemas**: Validação com Zod em todas as entradas de dados do usuário.
- **Auditoria**: Ações críticas de exclusão e alterações registradas em tabela de auditoria (`audit_logs`).

---

## 📜 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
