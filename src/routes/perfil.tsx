import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Building2, History, Mail } from "lucide-react";
import { AppShell } from "@/components/library/AppShell";
import { PageIntro } from "@/components/library/LibraryComponents";
import { useLibrary } from "@/components/library/LibraryProvider";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [
    { title: "Perfil — Biblioteca Sindauto" },
    { name: "description", content: "Perfil do colaborador da Biblioteca Sindauto Bahia." },
    { property: "og:title", content: "Perfil — Biblioteca Sindauto" },
    { property: "og:description", content: "Perfil do colaborador da Biblioteca Sindauto Bahia." },
    { property: "og:type", content: "profile" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { loans } = useLibrary();
  return <AppShell><PageIntro title="Meu perfil" subtitle="Seus dados e sua jornada de leitura" /><section className="overflow-hidden rounded-card border border-border bg-card shadow-card"><div className="bg-primary px-5 py-7 text-center text-primary-foreground"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-primary-foreground/40 bg-brand-yellow text-2xl font-extrabold text-brand-red">AB</div><h2 className="mt-3 text-xl font-bold">Adonai Bonfim</h2><p className="text-sm text-primary-foreground/75">Colaborador Sindauto Bahia</p></div><div className="space-y-4 p-5 text-sm"><p className="flex items-center gap-3"><Mail className="text-primary" size={19} /><span><small className="block text-muted-foreground">E-mail</small>adonai@sindautobahia.com.br</span></p><p className="flex items-center gap-3"><Building2 className="text-primary" size={19} /><span><small className="block text-muted-foreground">Setor</small>Comunicação</span></p><div className="grid grid-cols-2 gap-3 pt-2"><div className="rounded-xl bg-muted p-4"><BookOpen className="text-primary" size={20} /><strong className="mt-2 block text-2xl">{loans.filter((loan) => loan.status !== "devolvido").length}</strong><span className="text-xs text-muted-foreground">Com você</span></div><div className="rounded-xl bg-muted p-4"><History className="text-primary" size={20} /><strong className="mt-2 block text-2xl">{loans.length}</strong><span className="text-xs text-muted-foreground">Empréstimos</span></div></div></div></section></AppShell>;
}