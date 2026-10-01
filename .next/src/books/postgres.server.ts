import { randomUUID } from "node:crypto";
import { bookInput, type BookInput, type StoredBook } from "./schema.ts";
import { loanDates } from "../../../src/lib/prototype-loans.ts";
import { loanProgress } from "../history/status.ts";
import type { SqlDatabase, SqlClient } from "../database/postgres.server.ts";

const displayDate = (iso: string) => iso.split("-").reverse().join("/");
export class PostgresLibraryStore {
  private db: SqlDatabase;
  constructor(db: SqlDatabase) { this.db = db; }
  async books(includeRemoved = false, client: SqlClient = this.db): Promise<StoredBook[]> {
    const { rows } = await client.query(`SELECT b.*, COUNT(l.id)::int AS active_count, MIN(l.due_iso) AS next_due
      FROM books b LEFT JOIN loans l ON l.book_id=b.id AND l.returned_at IS NULL
      WHERE ${includeRemoved ? "TRUE" : "b.removed_at IS NULL"}
      GROUP BY b.id ORDER BY lower(b.title)`);
    return rows.map(book => ({
      id: book.id, title: book.title, author: book.author, category: book.category,
      description: book.description, cover: book.cover, quantity: book.quantity, revision: book.revision,
      availableCount: book.quantity - book.active_count,
      status: book.quantity === 0 ? "Sem estoque" : book.quantity > book.active_count ? "Disponível" : "Emprestado",
      availableAgain: book.next_due ? displayDate(book.next_due) : undefined,
    }));
  }
  async save(input: BookInput, id?: string, revision?: number) {
    const data = bookInput.parse(input);
    return this.db.transaction(async client => {
      const duplicate = (await client.query("SELECT id,removed_at FROM books WHERE lower(title)=lower($1) AND lower(author)=lower($2) AND id<>$3", [data.title, data.author, id ?? ""])).rows[0];
      if (!id && duplicate?.removed_at) {
        await client.query("UPDATE books SET category=$1,description=$2,cover=$3,quantity=$4,removed_at=NULL,revision=revision+1 WHERE id=$5",
          [data.category, data.description, data.cover || "/books/placeholder.svg", data.quantity, duplicate.id]);
        return duplicate.id as string;
      }
      if (duplicate) throw new Error("Este título e autor já estão cadastrados. Edite a quantidade do livro existente.");
      if (id) {
        const book = (await client.query("SELECT revision FROM books WHERE id=$1 AND removed_at IS NULL", [id])).rows[0];
        if (!book) throw new Error("Livro não encontrado.");
        if (book.revision !== revision) throw new Error("Este livro foi alterado em outra tela. Reabra a edição para atualizar.");
        const count = (await client.query("SELECT COUNT(*)::int AS count FROM loans WHERE book_id=$1 AND returned_at IS NULL", [id])).rows[0].count;
        if (data.quantity < count) throw new Error("A quantidade não pode ser menor que o número de exemplares emprestados.");
        await client.query("UPDATE books SET title=$1,author=$2,category=$3,description=$4,cover=$5,quantity=$6,revision=revision+1 WHERE id=$7",
          [data.title, data.author, data.category, data.description, data.cover || "/books/placeholder.svg", data.quantity, id]);
      } else {
        id = randomUUID();
        await client.query("INSERT INTO books(id,title,author,category,description,cover,quantity) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [id, data.title, data.author, data.category, data.description, data.cover || "/books/placeholder.svg", data.quantity]);
      }
      return id;
    });
  }
  async remove(id: string, revision: number) {
    await this.db.transaction(async client => {
      const book = (await client.query("SELECT revision FROM books WHERE id=$1 AND removed_at IS NULL", [id])).rows[0];
      if (!book) throw new Error("Livro não encontrado ou já removido.");
      if (book.revision !== revision) throw new Error("Este livro foi alterado. Atualize a página antes de remover.");
      if ((await client.query("SELECT id FROM loans WHERE book_id=$1 AND returned_at IS NULL", [id])).rows.length) throw new Error("Este livro possui empréstimos ativos. Registre as devoluções antes de remover.");
      await client.query("UPDATE books SET removed_at=$1,revision=revision+1 WHERE id=$2", [new Date().toISOString(), id]);
    });
  }
  async snapshot(userId: string) {
    const books = await this.books();
    const historyBooks = new Map((await this.books(true)).map(book => [book.id, book]));
    const { rows } = await this.db.query("SELECT * FROM loans WHERE user_id=$1 ORDER BY created_at DESC,id DESC", [userId]);
    return { books, loans: rows.map(row => ({
      id: row.id as string, bookId: row.book_id as string, book: historyBooks.get(row.book_id)!,
      checkoutDate: row.checkout_date as string, checkoutTime: row.checkout_time as string,
      dueDate: displayDate(row.due_iso), returnedAt: row.returned_at as string | null, renewed: Boolean(row.renewed),
      status: row.returned_at ? "devolvido" as const : row.renewed ? "renovado" as const : "ativo" as const,
    })) };
  }
  async adminHistory(now = new Date()) {
    const { rows } = await this.db.query(`SELECT l.*,u.first_name,u.last_name,u.phone,u.department,
      b.title,b.author,b.cover,b.removed_at AS book_removed_at
      FROM loans l JOIN users u ON u.id=l.user_id JOIN books b ON b.id=l.book_id
      ORDER BY l.created_at DESC,l.id DESC`);
    return { generatedAt: now.toISOString(), records: rows.map(row => ({
      id: row.id as string, person: `${row.first_name} ${row.last_name}`, phone: row.phone as string, department: row.department as string,
      title: row.title as string, author: row.author as string, cover: row.cover as string, bookRemoved: Boolean(row.book_removed_at),
      checkoutDate: row.checkout_date as string, checkoutISO: (row.checkout_date as string).split("/").reverse().join("-"), checkoutTime: row.checkout_time as string,
      dueDate: displayDate(row.due_iso), dueISO: row.due_iso as string, returnedAt: row.returned_at as string | null,
      renewed: Boolean(row.renewed), ...loanProgress(row.due_iso, row.returned_at, now),
    })) };
  }
  async change(userId: string, action: "borrow" | "renew" | "return", id: string, now = new Date()) {
    await this.db.transaction(async client => {
      if (action === "borrow") {
        if ((await client.query("SELECT id FROM loans WHERE user_id=$1 AND returned_at IS NULL LIMIT 1", [userId])).rows.length) throw new Error("Você já possui um livro emprestado. Devolva-o antes de solicitar outro.");
        const book = (await this.books(false, client)).find(book => book.id === id);
        if (!book) throw new Error("Livro não encontrado.");
        if (book.availableCount < 1) throw new Error("Este livro está indisponível. Confira a previsão de devolução no catálogo.");
        if ((await client.query("SELECT id FROM loans WHERE user_id=$1 AND book_id=$2 AND returned_at IS NULL", [userId, id])).rows.length) throw new Error("Você já está com um exemplar deste livro.");
        const dates = loanDates(now);
        await client.query("INSERT INTO loans(id,user_id,book_id,checkout_date,checkout_time,due_iso,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [randomUUID(), userId, id, dates.checkoutDate, dates.checkoutTime, dates.dueISO, now.toISOString()]);
      } else {
        const loan = (await client.query("SELECT * FROM loans WHERE id=$1 AND user_id=$2 AND returned_at IS NULL", [id, userId])).rows[0];
        if (!loan) throw new Error("Empréstimo não encontrado ou já devolvido.");
        if (action === "return") await client.query("UPDATE loans SET returned_at=$1 WHERE id=$2", [now.toISOString(), id]);
        else {
          if (loan.renewed) throw new Error("Este empréstimo já foi renovado.");
          const due = new Date(`${loan.due_iso}T12:00:00Z`); due.setUTCDate(due.getUTCDate() + 15);
          await client.query("UPDATE loans SET due_iso=$1,renewed=1 WHERE id=$2", [due.toISOString().slice(0, 10), id]);
        }
      }
    });
    return this.snapshot(userId);
  }
}
