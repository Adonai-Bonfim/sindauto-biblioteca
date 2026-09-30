import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/library/AppShell";
import { BookCard, CategoryFilter, PageIntro, SearchBar } from "@/components/library/LibraryComponents";
import { categories } from "@/lib/library-data";
import { useLibrary } from "@/components/library/LibraryProvider";

export const Route = createFileRoute("/catalogo")({
  head: () => ({ meta: [
    { title: "Catálogo — Biblioteca Sindauto" },
    { name: "description", content: "Consulte todos os livros da Biblioteca Sindauto Bahia." },
    { property: "og:title", content: "Catálogo — Biblioteca Sindauto" },
    { property: "og:description", content: "Consulte todos os livros da Biblioteca Sindauto Bahia." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CatalogPage,
});

function CatalogPage() {
  const { books, ready } = useLibrary();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const filters = ["Todos", "Disponíveis", "Emprestados", ...new Set([...categories.slice(1), ...books.map(book => book.category)])];
  const filtered = useMemo(() => books.filter((book) => {
    const matchesSearch = `${book.title} ${book.author}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Todos" || (filter === "Disponíveis" && book.status === "Disponível") || (filter === "Emprestados" && book.status === "Emprestado") || book.category === filter;
    return matchesSearch && matchesFilter;
  }), [search, filter, books]);
  return <AppShell><PageIntro title="Catálogo" subtitle="Encontre sua próxima leitura" /><SearchBar value={search} onChange={setSearch} /><CategoryFilter categories={filters} active={filter} onChange={setFilter} /><div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{filtered.map((book) => <BookCard key={book.id} book={book} />)}</div>{!ready && <p role="status" className="py-8">Carregando catálogo…</p>}{ready && filtered.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Nenhum livro encontrado.</p>}</AppShell>;
}
