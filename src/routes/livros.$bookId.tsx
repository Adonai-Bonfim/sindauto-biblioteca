import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/library/AppShell";
import { useLibrary } from "@/components/library/LibraryProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Loan } from "@/lib/library-data";
import { loanDates } from "@/lib/prototype-loans";

export const Route = createFileRoute("/livros/$bookId")({
  head: ({ params }) => {
    const title = "Livro — Biblioteca Sindauto";
    const description = "Detalhes do livro na Biblioteca Sindauto Bahia.";
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "book" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: BookDetailsPage,
});

function BookDetailsPage() {
  const { bookId } = Route.useParams();
  const { books, borrow, busy, ready } = useLibrary();
  const book = books.find((item) => item.id === bookId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [completed, setCompleted] = useState<Loan>();
  const dates = loanDates();
  if (!ready) return <AppShell><p role="status">Consultando o livro…</p></AppShell>;
  if (!book) return <AppShell><p>Livro não encontrado.</p></AppShell>;
  const available = book.status === "Disponível";
  const confirm = async () => { const loan = await borrow(book); setConfirmOpen(false); if (loan) { setCompleted(loan); setSuccessOpen(true); } };
  return <AppShell><Link to="/catalogo" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"><ArrowLeft size={18} />Voltar ao catálogo</Link><section className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)] md:gap-10"><img src={book.cover} alt={`Capa de ${book.title}`} width={768} height={1152} className="mx-auto aspect-[2/3] w-full max-w-[240px] rounded-lg object-cover shadow-cover md:max-w-none" /><div className="min-w-0"><span className="text-xs font-bold uppercase text-primary">{book.category}</span><h1 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">{book.title}</h1><p className="mt-2 text-base text-muted-foreground">{book.author}</p><span className={`mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${available ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}><span className={`h-2 w-2 rounded-full ${available ? "bg-success" : "bg-danger"}`} />{!ready ? "Consultando…" : book.status === "Sem estoque" ? "Sem estoque" : available ? "Disponível" : `Emprestado até ${book.availableAgain}`}</span><div className="my-6 h-px bg-border" /><h2 className="font-bold">Sobre o livro</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{book.description}</p><div className="mt-5 flex items-center gap-3 rounded-xl bg-muted p-4"><CalendarDays className="text-primary" /><span className="text-sm"><small className="block text-muted-foreground">Prazo de empréstimo</small><strong>15 dias</strong></span></div><Button size="lg" disabled={!available || !ready || busy} onClick={() => setConfirmOpen(true)} className="mt-6 h-12 w-full rounded-xl text-base md:w-auto">{available ? "Pegar emprestado" : "Indisponível no momento"}</Button></div></section><Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent className="w-[calc(100%-2rem)] rounded-card"><DialogHeader><DialogTitle>Confirmar empréstimo?</DialogTitle><DialogDescription>Revise as informações antes de confirmar.</DialogDescription></DialogHeader><div className="space-y-3 rounded-xl bg-muted p-4 text-sm"><p><span className="text-muted-foreground">Livro</span><strong className="block">{book.title}</strong></p><div className="grid grid-cols-2 gap-3"><p><span className="text-muted-foreground">Retirada</span><strong className="block">{dates.checkoutDate} · {dates.checkoutTime}</strong></p><p><span className="text-muted-foreground">Prazo</span><strong className="block">15 dias</strong></p></div><p><span className="text-muted-foreground">Devolução prevista</span><strong className="block text-primary">{dates.dueDate}</strong></p></div><DialogFooter className="gap-2"><Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button><Button disabled={busy || !available || !ready} onClick={confirm}>{busy ? "Confirmando…" : "Confirmar empréstimo"}</Button></DialogFooter></DialogContent></Dialog><Dialog open={successOpen} onOpenChange={setSuccessOpen}><DialogContent className="w-[calc(100%-2rem)] rounded-card text-center"><CheckCircle2 className="mx-auto text-success" size={48} /><DialogHeader className="text-center"><DialogTitle>Empréstimo realizado com sucesso!</DialogTitle><DialogDescription>{book.title} está com você até {completed?.dueDate}.</DialogDescription></DialogHeader><Button asChild className="w-full"><Link to="/meus-livros">Ver meus empréstimos</Link></Button></DialogContent></Dialog></AppShell>;
}
