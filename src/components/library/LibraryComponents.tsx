import { ArrowRight, BookOpen, CalendarDays, RotateCcw, Search, Undo2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { Book, Loan } from "@/lib/library-data";

export function PageIntro({ title = "Biblioteca Sindauto", subtitle = "Olá! Escolha seu próximo livro" }: { title?: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="mt-0.5 text-primary"><BookOpen size={34} strokeWidth={2.2} /></div>
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          {title === "Biblioteca Sindauto" ? <><span>Biblioteca </span><span className="text-primary">Sindauto</span></> : title}
        </h1>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground sm:text-base">{subtitle}</p>
        <div className="mt-3 h-1 w-10 rounded-full bg-brand-yellow" />
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-full bg-muted px-4 text-muted-foreground focus-within:ring-2 focus-within:ring-ring/30">
      <Search size={20} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Pesquisar livro..." className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground" />
    </label>
  );
}

export function CategoryFilter({ categories, active, onChange }: { categories: string[]; active: string; onChange: (category: string) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-3 sm:mx-0 sm:px-0">
      {categories.map((category) => (
        <Button key={category} type="button" size="sm" variant={active === category ? "default" : "secondary"} onClick={() => onChange(category)} className="h-9 shrink-0 rounded-full px-4 font-semibold shadow-none">
          {category}
        </Button>
      ))}
    </div>
  );
}

export function SectionHeading({ title, to }: { title: string; to?: "/catalogo" | "/meus-livros" }) {
  return (
    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h2 className="truncate text-lg font-extrabold text-foreground sm:text-xl">{title}</h2>
      {to && <Link to={to} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary sm:text-sm">Ver todos <ArrowRight size={15} /></Link>}
    </div>
  );
}

export function BookCard({ book }: { book: Book }) {
  const available = book.status === "Disponível";
  return (
    <article className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-card border border-border bg-card p-2.5 shadow-card sm:grid-cols-[88px_minmax(0,1fr)] sm:p-3">
      <img src={book.cover} alt={`Capa de ${book.title}`} loading="lazy" width={768} height={1152} className="aspect-[2/3] h-full max-h-36 w-full rounded-md object-cover shadow-cover" />
      <div className="flex min-w-0 flex-col">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-card-foreground">{book.title}</h3>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">{book.author}</p>
        <span className={`mt-2 inline-flex w-fit max-w-full items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${available ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${available ? "bg-success" : "bg-danger"}`} />
          <span className="truncate">{available ? "Disponível" : `Emprestado até ${book.availableAgain}`}</span>
        </span>
        <Button asChild size="sm" className="mt-auto h-9 w-full rounded-lg px-2 text-xs shadow-none">
          <Link to="/livros/$bookId" params={{ bookId: book.id }}>Ver livro <ArrowRight size={14} /></Link>
        </Button>
      </div>
    </article>
  );
}

export function LoanCard({ loan, onRenew, onReturn }: { loan: Loan; onRenew: () => void; onReturn: () => void }) {
  return (
    <article className="grid gap-4 rounded-card border border-border bg-card p-3 shadow-card sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center">
      <div className="grid grid-cols-[68px_minmax(0,1fr)] gap-3 sm:contents">
        <img src={loan.book.cover} alt={`Capa de ${loan.book.title}`} loading="lazy" width={768} height={1152} className="aspect-[2/3] w-[68px] rounded-md object-cover shadow-cover sm:w-[88px]" />
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-card-foreground">{loan.book.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{loan.book.author}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
            <span className="text-muted-foreground"><CalendarDays size={13} className="mb-1" />Retirada em<strong className="block text-foreground">{loan.checkoutDate}</strong></span>
            <span className="text-muted-foreground"><CalendarDays size={13} className="mb-1" />Devolução até<strong className="block text-primary">{loan.dueDate}</strong></span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:w-28 sm:grid-cols-1">
        <Button variant="outline" size="sm" onClick={onRenew} disabled={loan.renewed} className="rounded-lg"><RotateCcw />{loan.renewed ? "Renovado" : "Renovar"}</Button>
        <Button variant="outline" size="sm" onClick={onReturn} className="rounded-lg border-primary text-primary hover:bg-danger-soft"><Undo2 />Devolver</Button>
      </div>
    </article>
  );
}