import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, ChevronRight, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/library/AppShell";
import { BookCard, CategoryFilter, LoanCard, PageIntro, SearchBar, SectionHeading } from "@/components/library/LibraryComponents";
import { useLibrary } from "@/components/library/LibraryProvider";
import { categories } from "@/lib/library-data";
import { useAuth } from "@/components/library/AuthProvider";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Biblioteca Sindauto Bahia" },
    { name: "description", content: "Consulte livros e acompanhe seus empréstimos na Biblioteca Sindauto Bahia." },
    { property: "og:title", content: "Biblioteca Sindauto Bahia" },
    { property: "og:description", content: "Consulte livros e acompanhe seus empréstimos na Biblioteca Sindauto Bahia." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  const user = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const { books, loans, renew, returnBook, ready } = useLibrary();
  const filtered = useMemo(() => books.filter((book) => {
    const matchesSearch = `${book.title} ${book.author}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "Todos" || book.category === category;
    return matchesSearch && matchesCategory;
  }), [search, category, books]);
  const activeLoans = loans.filter((loan) => loan.status !== "devolvido");

  return (
    <AppShell>
      <PageIntro subtitle={`Olá, ${user.user_metadata["first_name"] || "leitor"}! Escolha seu próximo livro`} />
      <section className="mb-4 grid grid-cols-2 gap-3" aria-label="Resumo">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-card border border-border bg-card p-3 shadow-card sm:p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-danger-soft text-primary"><BookOpen size={20} /></span>
          <span className="min-w-0 text-xs text-muted-foreground sm:text-sm">Disponíveis<strong className="block text-2xl font-extrabold text-primary">{ready ? books.reduce((total, book) => total + book.availableCount, 0) : "…"}</strong></span>
          <ChevronRight className="shrink-0 text-muted-foreground" size={17} />
        </div>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-card border border-border bg-card p-3 shadow-card sm:p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning-foreground"><UserRound size={20} /></span>
          <span className="min-w-0 text-xs text-muted-foreground sm:text-sm">Com você<strong className="block text-2xl font-extrabold text-primary">{activeLoans.length}</strong></span>
          <ChevronRight className="shrink-0 text-muted-foreground" size={17} />
        </div>
      </section>
      <SearchBar value={search} onChange={setSearch} />
      <CategoryFilter categories={[...new Set([...categories, ...books.map(book => book.category)])]} active={category} onChange={setCategory} />
      <section className="mt-1">
        <SectionHeading title="Livros da biblioteca" to="/catalogo" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{filtered.map((book) => <BookCard key={book.id} book={book} />)}</div>
        {!ready && <p role="status" className="py-8 text-center text-sm">Carregando livros…</p>}
        {ready && filtered.length === 0 && <p className="rounded-card border border-dashed border-border py-12 text-center text-sm text-muted-foreground">Nenhum livro encontrado nesta categoria.</p>}
      </section>
      <section className="mt-7">
        <SectionHeading title="Meus empréstimos" to="/meus-livros" />
        <div className="space-y-3">{activeLoans.map((loan) => <LoanCard key={loan.id} loan={loan} onRenew={() => renew(loan.id)} onReturn={() => returnBook(loan.id)} />)}</div>
      </section>
    </AppShell>
  );
}
