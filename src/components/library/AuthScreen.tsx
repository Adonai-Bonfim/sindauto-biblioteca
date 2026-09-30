import { useState, type FormEvent } from "react";
import { BookOpen, Eye, EyeOff, LoaderCircle, ArrowRight } from "lucide-react";
import { Brand } from "./AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInPrototype, signUpPrototype } from "@/lib/prototype-auth";
import { normalizePhone } from "@/lib/auth";

export function AuthScreen({ sessionError = false }: { sessionError?: boolean }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(sessionError ? "Não foi possível recuperar sua sessão. Entre novamente." : "");
  const [notice, setNotice] = useState("");
  const signup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    let phone: string;
    try { phone = normalizePhone(String(form.get("phone"))); }
    catch (err) { setError((err as Error).message); return; }
    const password = String(form.get("password"));
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const department = String(form.get("department") ?? "").trim();
    if (signup && (!firstName || !lastName || !department)) {
      setError("Preencha seu nome, sobrenome e setor."); return;
    }
    setBusy(true);
    try {
      if (signup) {
        await signUpPrototype(phone, password, { first_name: firstName, last_name: lastName, name: `${firstName} ${lastName}`, department });
      } else {
        await signInPrototype(phone, password);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível conectar à biblioteca. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <div className="min-h-screen bg-background">
    <header className="bg-primary"><div className="mx-auto flex h-20 max-w-app items-center px-5"><Brand /></div></header>
    <main className="mx-auto max-w-md px-5 py-7 sm:py-10">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-yellow text-brand-red"><BookOpen size={28} /></span>
        <h1 className="text-2xl font-extrabold">Sua próxima leitura<br /><span className="text-primary">começa aqui.</span></h1>
        <p className="mt-2 text-sm text-muted-foreground">Bem-vindo à Biblioteca Sindauto Bahia.</p>
      </div>
      <section className="rounded-card border border-border bg-card p-5 shadow-card sm:p-6" aria-labelledby="auth-title">
        <p className="mb-4 rounded-lg bg-muted p-3 text-xs leading-relaxed">Seu cadastro fica salvo. Use o mesmo telefone e senha para entrar em qualquer dispositivo.</p>
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" aria-label="Opções de acesso">
          {([['signup', 'Criar cadastro'], ['login', 'Entrar']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={mode === value} disabled={busy} onClick={() => { setMode(value); setError(""); setNotice(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${mode === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}>{label}</button>)}
        </div>
        <h2 id="auth-title" className="text-lg font-bold">{signup ? "Vamos nos conhecer?" : "Que bom ter você de volta!"}</h2>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">{signup ? "Um cadastro rápido para identificar você nos empréstimos." : "Use seu telefone e sua senha para continuar."}</p>
        <form key={mode} onSubmit={submit} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            {signup && <>
              <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="firstName">Nome</Label><Input className="h-11" id="firstName" name="firstName" autoComplete="given-name" placeholder="Seu nome" required maxLength={80} /></div>
                <div className="space-y-2"><Label htmlFor="lastName">Sobrenome</Label><Input className="h-11" id="lastName" name="lastName" autoComplete="family-name" placeholder="Seu sobrenome" required maxLength={120} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="department">Setor</Label><Input className="h-11" id="department" name="department" placeholder="Ex.: Administrativo" required maxLength={100} /></div>
            </>}
            <div className="space-y-2"><Label htmlFor="phone">Telefone com DDD</Label><Input className="h-11" id="phone" name="phone" type="tel" inputMode="tel" autoComplete={signup ? "tel" : "username"} placeholder="(71) 99999-9999" required maxLength={22} aria-describedby={signup ? "phone-hint" : undefined} />{signup && <p id="phone-hint" className="text-xs text-muted-foreground">Você usará este número para entrar.</p>}</div>
            <div className="space-y-2"><Label htmlFor="password">Senha</Label><div className="relative"><Input className="h-11 pr-12" id="password" name="password" type={visible ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "Crie sua senha" : "Sua senha"} required minLength={signup ? 8 : 1} maxLength={128} aria-describedby={signup ? "password-hint" : undefined} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-md text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary">{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>{signup && <p id="password-hint" className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>}</div>
          </fieldset>
          {error && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-primary">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-muted p-3 text-sm">{notice}</p>}
          <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl font-bold">{busy ? <><LoaderCircle className="animate-spin" size={18} /> Aguarde…</> : <>{signup ? "Cadastrar e acessar" : "Entrar na biblioteca"}<ArrowRight size={18} /></>}</Button>
        </form>
      </section>
      <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">Seus dados identificam você na biblioteca<br />e ajudam a acompanhar seus empréstimos.</p>
    </main>
  </div>;
}
