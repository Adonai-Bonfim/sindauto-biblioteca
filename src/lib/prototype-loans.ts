export type SharedLoan = {
  id: string; userId: string; bookId: string; checkoutDate: string;
  checkoutTime: string; dueDate: string; dueISO: string;
  status: "ativo" | "devolvido" | "renovado"; renewed: boolean;
};
export const bookIds = ["habitos-atomicos", "essencialismo", "inteligencia-emocional", "comece-pelo-porque"];
export function loanDates(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const due = new Date(`${date}T12:00:00Z`);
  due.setUTCDate(due.getUTCDate() + 15);
  const dueISO = due.toISOString().slice(0, 10);
  return { checkoutDate: displayDate(date), checkoutTime: now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }), dueISO, dueDate: displayDate(dueISO) };
}
function displayDate(iso: string) { return iso.split("-").reverse().join("/"); }
export function createLoanStore() {
  const loans: SharedLoan[] = [];
  return {
    snapshot(userId: string) {
      return {
        loans: loans.filter(loan => loan.userId === userId).map(loan => ({ ...loan })),
        availability: loans.filter(loan => loan.status !== "devolvido").map(({ bookId, dueDate }) => ({ bookId, dueDate })),
      };
    },
    change(userId: string, action: "borrow" | "renew" | "return", id: string, now = new Date()) {
      if (action === "borrow") {
        if (loans.some(loan => loan.userId === userId && loan.status !== "devolvido")) throw new Error("Você já possui um livro emprestado. Devolva-o antes de solicitar outro.");
        if (!bookIds.includes(id)) throw new Error("Livro não encontrado.");
        if (loans.some(loan => loan.bookId === id && loan.status !== "devolvido")) throw new Error("Este livro já foi emprestado. Confira a data de devolução no catálogo.");
        loans.unshift({ id: crypto.randomUUID(), bookId: id, userId, ...loanDates(now), status: "ativo", renewed: false });
      } else {
        const loan = loans.find(item => item.id === id && item.userId === userId);
        if (!loan || loan.status === "devolvido") throw new Error("Empréstimo não encontrado ou já devolvido.");
        if (action === "return") loan.status = "devolvido";
        else {
          if (loan.renewed) throw new Error("Este empréstimo já foi renovado.");
          const due = new Date(`${loan.dueISO}T12:00:00Z`);
          due.setUTCDate(due.getUTCDate() + 15);
          loan.dueISO = due.toISOString().slice(0, 10);
          loan.dueDate = displayDate(loan.dueISO);
          loan.renewed = true; loan.status = "renovado";
        }
      }
      return this.snapshot(userId);
    },
  };
}
