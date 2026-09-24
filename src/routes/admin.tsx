import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/library/AppShell";
import { PageIntro } from "@/components/library/LibraryComponents";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Administração — Biblioteca Sindauto" },
    { name: "description", content: "Área administrativa da Biblioteca Sindauto Bahia." },
    { property: "og:title", content: "Administração — Biblioteca Sindauto" },
    { property: "og:description", content: "Área administrativa da Biblioteca Sindauto Bahia." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminPage,
});

function AdminPage() {
  return <AppShell><PageIntro title="Administração" subtitle="Área preparada para a equipe de RH" /><div className="rounded-card border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">O painel administrativo será desenvolvido na próxima etapa.</div></AppShell>;
}