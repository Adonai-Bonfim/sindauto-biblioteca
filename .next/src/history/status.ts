export function brazilDate(now: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function loanProgress(dueISO: string, returnedAt: string | null, now = new Date()) {
  const reference = returnedAt ? brazilDate(new Date(returnedAt)) : brazilDate(now);
  const daysRemaining = Math.round((Date.parse(`${dueISO}T12:00:00Z`) - Date.parse(`${reference}T12:00:00Z`)) / 86_400_000);
  return {
    status: returnedAt ? "devolvido" as const : daysRemaining < 0 ? "atrasado" as const : daysRemaining === 0 ? "hoje" as const : "em-dia" as const,
    daysRemaining,
    deadlineLabel: returnedAt ? daysRemaining < 0 ? `Devolvido com ${-daysRemaining} dia(s) de atraso` : "Devolvido no prazo" : daysRemaining < 0 ? `${-daysRemaining} dia(s) de atraso` : daysRemaining === 0 ? "Entrega hoje" : `Faltam ${daysRemaining} dia(s)`,
  };
}
