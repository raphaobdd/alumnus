/**
 * Biblioteca de templates de relatórios determinísticos por categoria.
 * Permite interpolação segura de variáveis sem uso de IA generativa.
 */

export interface ReportMessage {
  level: "high" | "attention" | "neutral" | "positive";
  category: "grade" | "absence" | "task" | "calendar" | "workload" | "routine" | "general";
  title: string;
  text: string;
  suggestedAction?: string;
  subjectId?: string;
}

export const TEMPLATES = {
  highRisk: {
    absenceLimitExceeded: {
      title: "Risco Alto: Limite de Faltas Atingido",
      text: "Sua frequência na matéria '{subject}' atingiu o limite máximo de {maxAbsences} faltas ({totalAbsences} faltas registradas). Qualquer nova falta resultará em reprovação direta.",
      suggestedAction: "Não falte de forma alguma em '{subject}'. Entre em contato com o professor se houver justificativa médica/legal.",
    },
    absenceLimitNear: {
      title: "Risco Alto: Faltas Críticas",
      text: "Atenção em '{subject}': você já consumiu {percentage}% do limite de faltas ({totalAbsences} de {maxAbsences}). Restam apenas {remaining} falta(s).",
      suggestedAction: "Você pode faltar no máximo mais {remaining} aula(s) em '{subject}' sem reprovar por frequência.",
    },
    gradeDroppingFast: {
      title: "Atenção Prioritária: Média em Queda",
      text: "Sua média na matéria '{subject}' caiu de {previousAverage} para {currentAverage}. Recomendamos revisar o conteúdo das últimas aulas.",
      suggestedAction: "Revise os tópicos das últimas aulas de '{subject}' e programe uma sessão de estudos antes da próxima avaliação.",
    },
    trendChangeWarning: {
      title: "Alerta de Tendência: Início de Queda em Média",
      text: "A disciplina '{subject}' apresentava desempenho estável/alto, mas iniciou uma tendência de queda recente (média atual: {currentAverage}).",
      suggestedAction: "Sua média começou a declinar após semanas de estabilidade. Reforce os exercícios da matéria nesta semana.",
    },
    multipleOverdueTasks: {
      title: "Alerta de Pendências: Tarefas Atrasadas",
      text: "Você possui {count} tarefa(s) com o prazo vencido. Priorize a entrega para evitar acúmulo de atividades.",
      suggestedAction: "Ordem recomendada: resolva primeiro a tarefa '{topTask}' e depois as demais pendências atrasadas.",
    },
    workloadHeavy: {
      title: "Alerta de Sobrecarga: Carga de Estudos Elevada",
      text: "Sua carga semanal estimada é de {totalHours}h ({classHours}h de aulas + {taskHours}h de tarefas pendentes).",
      suggestedAction: "Divida as tarefas em blocos menores de estudo diário e antecipe entregas nos dias mais livres.",
    },
  },
  attention: {
    absenceWarning: {
      title: "Atenção: Controle de Frequência",
      text: "Você atingiu {percentage}% do limite de faltas em '{subject}' ({totalAbsences} de {maxAbsences} faltas).",
      suggestedAction: "Mantenha a frequência regular em '{subject}'. Restam {remaining} falta(s) de margem de segurança.",
    },
    upcomingExam: {
      title: "Avaliação Próxima",
      text: "A prova de '{subject}' ({title}) está agendada para daqui a {daysLeft} dia(s) ({eventDate}).",
      suggestedAction: "Reserve blocos de revisão diários para '{title}' até a data da prova ({eventDate}).",
    },
    upcomingImportantDate: {
      title: "Data Importante Próxima",
      text: "Evento agendado: '{title}' ({category}) ocorre em {daysLeft} dia(s) ({eventDate}).",
      suggestedAction: "Marque a data ({eventDate}) no seu planejamento semanal para não perder prazos.",
    },
    taskPending: {
      title: "Tarefas Pendentes",
      text: "Existem {count} tarefa(s) pendente(s) acumulando no seu painel.",
      suggestedAction: "Inicie pela tarefa com maior prioridade para reduzir a fila de pendências.",
    },
    peakRoutineDay: {
      title: "Sobrecarga Pontual na Semanada",
      text: "Seu dia mais carregado é {dayName}, acumulando {eventCount} compromisso(s) (aulas e entregas).",
      suggestedAction: "Antecipe o preparo dos trabalhos de {dayName} para evitar correria no dia do prazo.",
    },
  },
  positive: {
    excellentGrades: {
      title: "Excelente Desempenho",
      text: "Parabéns! Sua média em '{subject}' é de {currentAverage}, mantendo um alto rendimento acadêmico.",
      suggestedAction: "Mantenha o bom hábito de revisão contínua que tem funcionado nesta disciplina.",
    },
    gradeRising: {
      title: "Evolução Acadêmica",
      text: "Sua média na disciplina '{subject}' subiu para {currentAverage} (anterior: {previousAverage}). Excelente progresso!",
      suggestedAction: "Continue aplicando o método de estudos atual em '{subject}'.",
    },
    allTasksDone: {
      title: "Todas as Tarefas em Dia",
      text: "Você concluiu todas as suas tarefas pendentes! Taxa de conclusão de 100%.",
      suggestedAction: "Aproveite para adiantar leituras ou descansar sem pendências acadêmicas acumuladas.",
    },
    idleDayOpportunity: {
      title: "Oportunidade na Rotina: Dia Livre Encontrado",
      text: "{idleDays} não tem aulas nem entregas agendadas.",
      suggestedAction: "Utilize {idleDays} como dia coringa para adiantar trabalhos da semana ou revisar matérias com maior dificuldade.",
    },
    perfectAttendance: {
      title: "Frequência Exemplar",
      text: "Sua presença está 100% em dia e sem alertas de faltas registradas.",
      suggestedAction: "Continue mantendo a assiduidade em todas as disciplinas.",
    },
  },
  neutral: {
    dailySummary: {
      title: "Resumo Acadêmico",
      text: "Seu acompanhamento acadêmico conta com {subjectCount} matéria(s) cadastrada(s) e {taskCount} tarefa(s) em andamento.",
      suggestedAction: "Mantenha seus registros de notas e presenças atualizados para análises precisas.",
    },
  },
};

export function formatTemplate(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}
