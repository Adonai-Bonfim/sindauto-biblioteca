import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Phone, LogOut } from "lucide-react";
import { AppShell } from "@/components/library/AppShell";
import { PageIntro } from "@/components/library/LibraryComponents";
import { useAuth } from "@/components/library/AuthProvider";
import { Button } from "@/components/ui/button";
import { signOutPrototype } from "@/lib/prototype-auth";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Biblioteca Sindauto" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const name = String(user.user_metadata["name"] || "Leitor");
  const initials = name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join("");
  async function logout() {
    setBusy(true); setError("");
    try {
      signOutPrototype();
    } catch { setError("Não foi possível sair. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <AppShell>
    <PageIntro title="Meu perfil" subtitle="Seus dados na biblioteca" />
    <section className="overflow-hidden rounded-card border border-border bg-card shadow-card">
      <div className="bg-primary px-5 py-7 text-center text-primary-foreground">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-primary-foreground/40 bg-brand-yellow text-2xl font-extrabold text-brand-red">{initials}</div>
        <h2 className="mt-3 text-xl font-bold">{name}</h2><p className="text-sm text-primary-foreground/75">Colaborador Sindauto Bahia</p>
      </div>
      <div className="space-y-4 p-5 text-sm">
        <p className="flex items-center gap-3"><Phone className="text-primary" size={19} /><span><small className="block text-muted-foreground">Telefone</small>{user.phone ? "+" + user.phone.replace(/^\+/, "") : "Não informado"}</span></p>
        <p className="flex items-center gap-3"><Building2 className="text-primary" size={19} /><span><small className="block text-muted-foreground">Setor</small>{user.user_metadata["department"] || "Não informado"}</span></p>
        {error && <p role="alert" className="text-primary">{error}</p>}
        <Button variant="outline" className="h-11 w-full" onClick={logout} disabled={busy}><LogOut size={18} />{busy ? "Saindo…" : "Sair da conta"}</Button>
      </div>
    </section>
  </AppShell>;
}
