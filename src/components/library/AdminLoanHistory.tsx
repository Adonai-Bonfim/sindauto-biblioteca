import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Search, Clock, BookOpen, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { PageIntro } from "./LibraryComponents";
import { readAdminHistory } from "@/lib/history.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const statusLabels = { "em-dia": "Em dia", hoje: "Entrega hoje", atrasado: "Atrasado", devolvido: "Devolvido" };
const statusColors = { "em-dia": "bg-success-soft text-success", hoje: "bg-warning-soft text-warning-foreground", atrasado: "bg-danger-soft text-primary", devolvido: "bg-muted text-muted-foreground" };
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const dateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export function AdminLoanHistory() {
  const user = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["admin-history", user.id], queryFn: readAdminHistory, enabled: user.isAdmin, refetchInterval: 15_000, refetchOnWindowFocus: "always", gcTime: 0 });
  if (!user.isAdmin) return null;
  const response = query.data;
  const records = response?.ok ? response.history.records : [];
  const invalidDates = Boolean(start && end && start > end);
  const filtered = records.filter(record => {
    const matching = normalize(`${record.person} ${record.title} ${record.author} ${record.phone} ${record.department}`).includes(normalize(search.trim()));
    const matchingStatus = status === "todos" || status === "abertos" && !record.returnedAt || status === "renovados" && record.renewed || status === record.status;
    return matching && matchingStatus && (!start || record.checkoutISO >= start) && (!end || record.checkoutISO <= end) && !invalidDates;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages);
  const shown = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  const totals = [
    { label: "Total de registros", value: records.length, icon: BookOpen },
    { label: "Em aberto", value: records.filter(r => !r.returnedAt).length, icon: Clock },
    { label: "Atrasados", value: records.filter(r => r.status === "atrasado").length, icon: AlertCircle },
    { label: "Devolvidos", value: records.filter(r => r.returnedAt).length, icon: CheckCircle2 },
  ];
  const failed = query.isError || response?.ok === false;
  return <section aria-label="Acompanhamento de empréstimos">
    <div className="flex flex-wrap justify-between gap-3"><PageIntro title="Acompanhamento" subtitle="Quem está com cada livro e todos os registros de devolução" /><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} className={query.isFetching ? "animate-spin" : ""} />Atualizar</Button></div>
    {failed ? <div role="alert" className="rounded-xl bg-danger-soft p-4 text-sm text-primary">{response?.ok === false ? response.message : "Não foi possível atualizar os registros. Tente novamente."}</div> : <>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{totals.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-card border bg-card p-4"><Icon size={20} className="text-primary" /><strong className="mt-2 block text-2xl">{query.isPending ? "…" : value}</strong><span className="text-xs text-muted-foreground">{label}</span></div>)}</div>
      <div className="mb-5 grid gap-4 rounded-card border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2 lg:col-span-1"><Label htmlFor="history-search">Pessoa, livro, setor ou telefone</Label><div className="relative"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><Input id="history-search" className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Pesquisar registros" /></div></div>
        <div className="space-y-2"><Label htmlFor="history-status">Situação</Label><select id="history-status" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="todos">Todos os registros</option><option value="abertos">Em aberto</option><option value="em-dia">Em dia</option><option value="hoje">Entrega hoje</option><option value="atrasado">Atrasados</option><option value="devolvido">Devolvidos</option><option value="renovados">Renovados</option></select></div>
        <div className="space-y-2"><Label htmlFor="history-start">Retirada a partir de</Label><Input id="history-start" type="date" value={start} onChange={e => { setStart(e.target.value); setPage(1); }} /></div>
        <div className="space-y-2"><Label htmlFor="history-end">Retirada até</Label><Input id="history-end" type="date" value={end} min={start || undefined} onChange={e => { setEnd(e.target.value); setPage(1); }} /></div>
        {(search || status !== "todos" || start || end) && <Button variant="ghost" className="w-fit" onClick={() => { setSearch(""); setStatus("todos"); setStart(""); setEnd(""); setPage(1); }}>Limpar filtros</Button>}
        {invalidDates && <p role="alert" className="text-sm text-primary sm:col-span-2">A data final deve ser igual ou posterior à inicial.</p>}
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{filtered.length} registro(s) encontrado(s). Horários de Brasília. {response?.ok && <>Atualizado em {dateTime(response.history.generatedAt)}.</>}</p>
      {query.isPending ? <p role="status" className="py-10 text-center">Carregando registros…</p> : shown.length === 0 ? <p className="rounded-card border border-dashed p-10 text-center text-muted-foreground">Nenhum empréstimo encontrado para estes filtros.</p> : <div className="space-y-3">{shown.map(record => <article key={record.id} className="rounded-card border bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">{record.title}</h2><p className="text-xs text-muted-foreground">{record.author}{record.bookRemoved ? " · Removido do acervo" : ""}</p></div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[record.status]}`}>{statusLabels[record.status]}</span>{record.renewed && <span className="rounded-full bg-muted px-3 py-1 text-xs">Renovado uma vez</span>}</div></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs text-muted-foreground">Colaborador</p><strong className="block text-sm">{record.person}</strong><p className="text-xs text-muted-foreground">{record.department}</p><a href={`tel:${record.phone}`} className="text-xs text-primary">{record.phone}</a></div><div><p className="text-xs text-muted-foreground">Retirada</p><strong className="text-sm">{record.checkoutDate} às {record.checkoutTime}</strong></div><div><p className="text-xs text-muted-foreground">Devolução prevista</p><strong className="text-sm">{record.dueDate}</strong><p className={`mt-1 text-xs font-semibold ${record.status === "atrasado" ? "text-primary" : "text-muted-foreground"}`}>{record.deadlineLabel}</p></div><div><p className="text-xs text-muted-foreground">Devolução registrada</p><strong className="text-sm">{record.returnedAt ? dateTime(record.returnedAt) : "Aguardando devolução"}</strong></div></div>
        <p className="mt-4 break-all border-t pt-2 text-[10px] text-muted-foreground">Registro: {record.id}</p>
      </article>)}</div>}
      {pages > 1 && <div className="mt-5 flex items-center justify-between gap-3"><Button variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button><span className="text-xs">Página {currentPage} de {pages}</span><Button variant="outline" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Próxima</Button></div>}
    </>}
  </section>;
}
