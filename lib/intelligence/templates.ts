/**
 * Biblioteca de templates de relatórios determinísticos por categoria.
 * Permite interpolação segura de variáveis sem uso de IA generativa.
 */

export interface ReportMessage {
  level: "high" | "attention" | "neutral" | "positive";
  category: "grade" | "absence" | "task" | "calendar" | "general";
  title: string;
  text: string;
}

export const TEMPLATES = {
  highRisk: {
    absenceLimitExceeded: {
      title: "Risco Alto: Limite de Faltas Atingido",
      text: "Sua frequência na matéria '{subject}' atingiu o limite máximo de {maxAbsences} faltas ({totalAbsences} faltas registradas). Qualquer nova falta resultará em reprovação direta.",
    },
    absenceLimitNear: {
      title: "Risco Alto: Faltas Críticas",
      text: "Atenção em '{subject}': você já consumiu {percentage}% do limite de faltas ({totalAbsences} de {maxAbsences}). Restam apenas {remaining} falta(s).",
    },
    gradeDroppingFast: {
      title: "Atenção Prioritária: Média em Queda",
      text: "Sua média na matéria '{subject}' caiu de {previousAverage} para {currentAverage}. Recomendamos revisar o conteúdo das últimas aulas.",
    },
    multipleOverdueTasks: {
      title: "Alerta de Pendências: Tarefas Atrasadas",
      text: "Você possui {count} tarefa(s) com o prazo vencido. Priorize a entrega para evitar acúmulo de atividades.",
    },
  },
  attention: {
    absenceWarning: {
      title: "Atenção: Controle de Frequência",
      text: "Você atingiu {percentage}% do limite de faltas em '{subject}' ({totalAbsences} de {maxAbsences} faltas).",
    },
    upcomingExam: {
      title: "Avaliação Próxima",
      text: "A prova de '{subject}' ({title}) está agendada para daqui a {daysLeft} dia(s) ({eventDate}).",
    },
    upcomingImportantDate: {
      title: "Data Importante Próxima",
      text: "Evento agendado: '{title}' ({category}) ocorre em {daysLeft} dia(s) ({eventDate}).",
    },
    taskPending: {
      title: "Tarefas Pendentes",
      text: "Existem {count} tarefa(s) pendente(s) aguardando conclusão.",
    },
  },
  positive: {
    excellentGrades: {
      title: "Excelente Desempenho",
      text: "Parabéns! Sua média em '{subject}' é de {currentAverage}, mantendo um alto rendimento acadêmico.",
    },
    gradeRising: {
      title: "Evolução Acadêmica",
      text: "Sua média na disciplina '{subject}' subiu para {currentAverage} (anterior: {previousAverage}). Excelente progresso!",
    },
    allTasksDone: {
      title: "Todas as Tarefas em Dia",
      text: "Você concluiu todas as suas tarefas pendentes! Taxa de conclusão de 100%.",
    },
    perfectAttendance: {
      title: "Frequência Exemplar",
      text: "Sua presença está 100% em dia e sem alertas de faltas registradas.",
    },
  },
  neutral: {
    dailySummary: {
      title: "Resumo Acadêmico Diário",
      text: "Seu acompanhamento acadêmico conta com {subjectCount} matéria(s) cadastrada(s) e {taskCount} tarefa(s) em andamento.",
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
