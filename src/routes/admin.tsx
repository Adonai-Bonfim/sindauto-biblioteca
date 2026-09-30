import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Plus, Pencil, BookOpen, LoaderCircle, Trash2 } from "lucide-react";
import { AppShell } from "@/components/library/AppShell";
import { PageIntro } from "@/components/library/LibraryComponents";
import { useAuth } from "@/components/library/AuthProvider";
import { useLibrary } from "@/components/library/LibraryProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { saveBook, removeBook } from "@/lib/books.functions";
import { bookInput } from "../../.next/src/books/schema";
import { categories, type Book } from "@/lib/library-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Acervo — Biblioteca Sindauto" }] }),
  component: AdminPage,
});
function AdminPage() {
  const user = useAuth();
  const { books, ready, refresh } = useLibrary();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removeError, setRemoveError] = useState("");
  async function confirmRemove() {
    if (!removing || deleting) return;
    setDeleting(true); setRemoveError(""); setSuccess("");
    try {
      const result = await removeBook({ data: { id: removing.id, revision: removing.revision } });
      if (!result.ok) { setRemoveError(result.message); return; }
      await refresh(); setRemoving(null); setSuccess("Livro removido do acervo. O histórico foi preservado.");
    } catch { setRemoveError("Não foi possível remover. Confira a conexão e tente novamente."); }
    finally { setDeleting(false); }
  }
  function edit(book: Book | null) { setEditing(book); setError(""); setSuccess(""); setOpen(true); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    const parsed = bookInput.safeParse({ title: fields.get("title"), author: fields.get("author"), category: fields.get("category"), description: fields.get("description"), cover: fields.get("cover"), quantity: Number(fields.get("quantity")) });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Confira os dados do livro."); return; }
    setSaving(true); setError("");
    try {
      const result = await saveBook({ data: { book: parsed.data, ...(editing ? { id: editing.id, revision: editing.revision } : {}) } });
      if (!result.ok) { setError(result.message); return; }
      await refresh(); setOpen(false); setSuccess(editing ? "Livro atualizado." : "Livro cadastrado e disponível no catálogo.");
    } catch { setError("Não foi possível salvar. Confira a conexão e tente novamente."); }
    finally { setSaving(false); }
  }
  if (!user.isAdmin) return <AppShell><PageIntro title="Administração" subtitle="Acesso restrito" /><p className="rounded-card border bg-card p-6">O cadastro e a edição de livros são feitos pelo administrador da biblioteca.</p></AppShell>;
  const filtered = books.filter(book => (book.title + " " + book.author).toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  return <AppShell>
    <Dialog open={Boolean(removing)} onOpenChange={value => { if (!value && !deleting) setRemoving(null); }}><DialogContent className="rounded-card"><DialogHeader><DialogTitle>Remover livro?</DialogTitle><DialogDescription>O livro “{removing?.title}” e seus exemplares sairão do catálogo. O histórico de empréstimos será mantido.</DialogDescription></DialogHeader>{removeError && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-primary">{removeError}</p>}<div className="flex justify-end gap-2"><Button variant="outline" disabled={deleting} onClick={() => setRemoving(null)}>Cancelar</Button><Button variant="destructive" disabled={deleting} onClick={confirmRemove}>{deleting ? "Removendo…" : "Confirmar remoção"}</Button></div></DialogContent></Dialog>
    <div className="flex flex-wrap items-start justify-between gap-3"><PageIntro title="Gerenciar acervo" subtitle="Cadastre livros e acompanhe os exemplares" /><Button className="h-11 rounded-xl" onClick={() => edit(null)}><Plus size={18} />Cadastrar livro</Button></div>
    <div className="mb-5 grid grid-cols-3 gap-3">{[["Títulos", books.length], ["Exemplares", books.reduce((sum, b) => sum + b.quantity, 0)], ["Disponíveis", books.reduce((sum, b) => sum + b.availableCount, 0)]].map(([label, count]) => <div key={label} className="rounded-xl border bg-card p-3"><span className="text-xs text-muted-foreground">{label}</span><strong className="block text-2xl text-primary">{ready ? count : "…"}</strong></div>)}</div>
    {success && <p role="status" className="mb-4 rounded-xl bg-success-soft p-3 text-sm text-success">{success}</p>}
    <Label htmlFor="inventory-search">Buscar no acervo</Label><Input id="inventory-search" className="mb-5 mt-2 h-11" placeholder="Título ou autor" value={search} onChange={event => setSearch(event.target.value)} />
    {!ready ? <p role="status">Carregando acervo…</p> : <div className="grid gap-3 md:grid-cols-2">{filtered.map(book => <article key={book.id} className="flex min-w-0 gap-3 rounded-card border bg-card p-4 shadow-card"><img src={book.cover} alt="" className="h-24 w-16 shrink-0 rounded object-cover" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/books/placeholder.svg"; }} /><div className="min-w-0 flex-1"><h2 className="font-bold">{book.title}</h2><p className="text-sm text-muted-foreground">{book.author}</p><p className="mt-2 text-xs">{book.availableCount} de {book.quantity} disponíveis · {book.category}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => edit(book)} aria-label={"Editar " + book.title}><Pencil size={14} />Editar</Button><Button variant="outline" size="sm" className="ml-2 mt-3 text-primary" onClick={() => { setRemoving(book); setRemoveError(""); }} aria-label={"Remover " + book.title}><Trash2 size={14} />Remover</Button></div></article>)}</div>}
    {ready && filtered.length === 0 && <p className="py-8 text-center text-muted-foreground">Nenhum livro encontrado.</p>}
    <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-card"><DialogHeader><DialogTitle>{editing ? "Editar livro" : "Cadastrar livro"}</DialogTitle><DialogDescription>Informe os dados e o total de exemplares que a biblioteca possui.</DialogDescription></DialogHeader>
      <form key={editing?.id ?? "new"} onSubmit={submit} className="space-y-4"><fieldset disabled={saving} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="book-title">Título</Label><Input id="book-title" name="title" required maxLength={200} defaultValue={editing?.title} /></div>
        <div className="space-y-2"><Label htmlFor="book-author">Autor</Label><Input id="book-author" name="author" required maxLength={160} defaultValue={editing?.author} /></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="book-category">Categoria</Label><Input id="book-category" name="category" list="book-categories" required maxLength={80} defaultValue={editing?.category} /><datalist id="book-categories">{[...new Set([...categories.slice(1), ...books.map(book => book.category)])].map(category => <option key={category} value={category} />)}</datalist></div><div className="space-y-2"><Label htmlFor="book-quantity">Exemplares</Label><Input id="book-quantity" name="quantity" type="number" inputMode="numeric" required min={0} max={10000} step={1} defaultValue={editing?.quantity ?? 1} /></div></div>
        <div className="space-y-2"><Label htmlFor="book-description">Descrição (opcional)</Label><Textarea id="book-description" name="description" maxLength={4000} defaultValue={editing?.description} /></div>
        <div className="space-y-2"><Label htmlFor="book-cover">Endereço da capa (opcional)</Label><Input id="book-cover" name="cover" inputMode="url" placeholder="https://..." maxLength={2048} defaultValue={editing?.cover === "/books/placeholder.svg" ? "" : editing?.cover} /><p className="text-xs text-muted-foreground">Sem imagem, será usada a capa padrão da biblioteca.</p></div>
      </fieldset>{error && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-primary">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={18} /> : <BookOpen size={18} />}{saving ? "Salvando…" : "Salvar livro"}</Button></div></form>
    </DialogContent></Dialog>
  </AppShell>;
}
