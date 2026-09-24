import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/library/AppShell";
import { LoanCard, PageIntro } from "@/components/library/LibraryComponents";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/components/library/LibraryProvider";

export const Route = createFileRoute("/meus-livros")({
  head: () => ({ meta: [
    { title: "Meus livros — Biblioteca Sindauto" },
    { name: "description", content: "Acompanhe seus empréstimos e seu histórico de leitura." },
    { property: "og:title", content: "Meus livros — Biblioteca Sindauto" },
    { property: "og:description", content: "Acompanhe seus empréstimos e seu histórico de leitura." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MyBooksPage,
});

function MyBooksPage() {
  const [tab, setTab] = useState<"current" | "history">("current");
  const { loans, renew, returnBook } = useLibrary();
  const visible = loans.filter((loan) => tab === "current" ? loan.status !== "devolvido" : loan.status === "devolvido");
  return <AppShell><PageIntro title="Meus livros" subtitle="Acompanhe seus prazos e leituras" /><div className="mb-5 grid grid-cols-2 rounded-xl bg-muted p-1"><Button variant={tab === "current" ? "default" : "ghost"} onClick={() => setTab("current")} className="rounded-lg shadow-none">Em andamento</Button><Button variant={tab === "history" ? "default" : "ghost"} onClick={() => setTab("history")} className="rounded-lg shadow-none">Histórico</Button></div><div className="space-y-3">{visible.map((loan) => <LoanCard key={loan.id} loan={loan} onRenew={() => renew(loan.id)} onReturn={() => returnBook(loan.id)} />)}{visible.length === 0 && <div className="rounded-card border border-dashed border-border py-16 text-center text-sm text-muted-foreground">Nenhum empréstimo nesta seção.</div>}</div></AppShell>;
}