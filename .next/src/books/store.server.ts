import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { bookInput, type BookInput, type StoredBook } from "./schema.ts";
import { initialBooks } from "./seed.ts";
import { loanDates } from "../../../src/lib/prototype-loans.ts";
import { loanProgress } from "../history/status.ts";

type BookRow = BookInput & { id: string; revision: number; active_count: number; next_due: string | null };
type LoanRow = { id: string; user_id: string; book_id: string; checkout_date: string; checkout_time: string; due_iso: string; returned_at: string | null; renewed: number };
const displayDate = (iso: string) => iso.split("-").reverse().join("/");
export class LibraryStore {
  private db: DatabaseSync;
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY, title TEXT NOT NULL COLLATE NOCASE, author TEXT NOT NULL COLLATE NOCASE,
        category TEXT NOT NULL, description TEXT NOT NULL, cover TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity >= 0),
        revision INTEGER NOT NULL DEFAULT 1, UNIQUE(title, author)
      );
      CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), book_id TEXT NOT NULL REFERENCES books(id),
        checkout_date TEXT NOT NULL, checkout_time TEXT NOT NULL, due_iso TEXT NOT NULL,
        returned_at TEXT, renewed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS loans_user_idx ON loans(user_id);
      CREATE INDEX IF NOT EXISTS loans_active_idx ON loans(book_id) WHERE returned_at IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS loans_user_book_active_idx ON loans(user_id, book_id) WHERE returned_at IS NULL;
    `);
    if (!this.db.prepare("PRAGMA table_info(books)").all().some(column => column["name"] === "removed_at")) {
      this.db.exec("ALTER TABLE books ADD COLUMN removed_at TEXT");
    }
    const seed = this.db.prepare("INSERT OR IGNORE INTO books (id,title,author,category,description,cover,quantity) VALUES (?,?,?,?,?,?,?)");
    for (const book of initialBooks) seed.run(book.id, book.title, book.author, book.category, book.description, book.cover, book.quantity);
  }
  private transaction<T>(run: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try { const result = run(); this.db.exec("COMMIT"); return result; }
    catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
  books(includeRemoved = false): StoredBook[] {
    const rows = this.db.prepare(`SELECT b.*, COUNT(l.id) AS active_count, MIN(l.due_iso) AS next_due
      FROM books b LEFT JOIN loans l ON l.book_id = b.id AND l.returned_at IS NULL
      WHERE ${includeRemoved ? "1=1" : "b.removed_at IS NULL"}
      GROUP BY b.id ORDER BY b.title COLLATE NOCASE`).all() as BookRow[];
    return rows.map(({ active_count, next_due, ...book }) => ({ ...book,
      availableCount: book.quantity - active_count,
      status: book.quantity === 0 ? "Sem estoque" : book.quantity > active_count ? "Disponível" : "Emprestado",
      availableAgain: next_due ? displayDate(next_due) : undefined,
    }));
  }
  save(input: BookInput, id?: string, revision?: number) {
    const data = bookInput.parse(input);
    return this.transaction(() => {
      const removed = !id && this.db.prepare("SELECT id FROM books WHERE title=? AND author=? AND removed_at IS NOT NULL").get(data.title, data.author);
      if (removed) {
        this.db.prepare("UPDATE books SET category=?,description=?,cover=?,quantity=?,removed_at=NULL,revision=revision+1 WHERE id=?")
          .run(data.category, data.description, data.cover || "/books/placeholder.svg", data.quantity, String(removed["id"]));
        return String(removed["id"]);
      }
      const duplicate = this.db.prepare("SELECT id FROM books WHERE title = ? AND author = ? AND id != ?").get(data.title, data.author, id ?? "");
      if (duplicate) throw new Error("Este título e autor já estão cadastrados. Edite a quantidade do livro existente.");
      if (id) {
        const book = this.db.prepare("SELECT revision FROM books WHERE id = ? AND removed_at IS NULL").get(id);
        if (!book) throw new Error("Livro não encontrado.");
        if (book["revision"] !== revision) throw new Error("Este livro foi alterado em outra tela. Reabra a edição para atualizar.");
        const count = this.db.prepare("SELECT COUNT(*) AS count FROM loans WHERE book_id = ? AND returned_at IS NULL").get(id)!;
        if (data.quantity < Number(count["count"])) throw new Error("A quantidade não pode ser menor que o número de exemplares emprestados.");
        this.db.prepare("UPDATE books SET title=?, author=?, category=?, description=?, cover=?, quantity=?, revision=revision+1 WHERE id=?")
          .run(data.title, data.author, data.category, data.description, data.cover || "/books/placeholder.svg", data.quantity, id);
      } else {
        id = randomUUID();
        this.db.prepare("INSERT INTO books (id,title,author,category,description,cover,quantity) VALUES (?,?,?,?,?,?,?)")
          .run(id, data.title, data.author, data.category, data.description, data.cover || "/books/placeholder.svg", data.quantity);
      }
      return id;
    });
  }
  remove(id: string, revision: number) {
    return this.transaction(() => {
      const book = this.db.prepare("SELECT revision FROM books WHERE id=? AND removed_at IS NULL").get(id);
      if (!book) throw new Error("Livro não encontrado ou já removido.");
      if (book["revision"] !== revision) throw new Error("Este livro foi alterado. Atualize a página antes de remover.");
      if (this.db.prepare("SELECT id FROM loans WHERE book_id=? AND returned_at IS NULL").get(id)) throw new Error("Este livro possui empréstimos ativos. Registre as devoluções antes de remover.");
      this.db.prepare("UPDATE books SET removed_at=?,revision=revision+1 WHERE id=?").run(new Date().toISOString(), id);
    });
  }
  snapshot(userId: string) {
    const books = this.books();
    const historyBooks = new Map(this.books(true).map(book => [book.id, book]));
    const rows = this.db.prepare("SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC, rowid DESC").all(userId) as LoanRow[];
    return { books, loans: rows.map(row => ({
      id: row.id, bookId: row.book_id, book: historyBooks.get(row.book_id)!, checkoutDate: row.checkout_date, checkoutTime: row.checkout_time,
      dueDate: displayDate(row.due_iso), returnedAt: row.returned_at, renewed: Boolean(row.renewed),
      status: row.returned_at ? "devolvido" as const : row.renewed ? "renovado" as const : "ativo" as const,
    })) };
  }
  adminHistory(now = new Date()) {
    const rows = this.db.prepare(`SELECT l.*, u.first_name, u.last_name, u.phone, u.department,
      b.title, b.author, b.cover, b.removed_at AS book_removed_at
      FROM loans l JOIN users u ON u.id=l.user_id JOIN books b ON b.id=l.book_id
      ORDER BY l.created_at DESC, l.rowid DESC`).all() as Array<LoanRow & {
        first_name: string; last_name: string; phone: string; department: string;
        title: string; author: string; cover: string; book_removed_at: string | null;
      }>;
    return { generatedAt: now.toISOString(), records: rows.map(row => ({
      id: row.id, person: `${row.first_name} ${row.last_name}`, phone: row.phone, department: row.department,
      title: row.title, author: row.author, cover: row.cover, bookRemoved: Boolean(row.book_removed_at),
      checkoutDate: row.checkout_date, checkoutISO: row.checkout_date.split("/").reverse().join("-"), checkoutTime: row.checkout_time,
      dueDate: displayDate(row.due_iso), dueISO: row.due_iso, returnedAt: row.returned_at,
      renewed: Boolean(row.renewed), ...loanProgress(row.due_iso, row.returned_at, now),
    })) };
  }
  change(userId: string, action: "borrow" | "renew" | "return", id: string, now = new Date()) {
    this.transaction(() => {
      if (action === "borrow") {
        if (this.db.prepare("SELECT id FROM loans WHERE user_id=? AND returned_at IS NULL LIMIT 1").get(userId)) throw new Error("Você já possui um livro emprestado. Devolva-o antes de solicitar outro.");
        const book = this.books().find(book => book.id === id);
        if (!book) throw new Error("Livro não encontrado.");
        if (book.availableCount < 1) throw new Error("Este livro está indisponível. Confira a previsão de devolução no catálogo.");
        if (this.db.prepare("SELECT id FROM loans WHERE user_id=? AND book_id=? AND returned_at IS NULL").get(userId, id)) throw new Error("Você já está com um exemplar deste livro.");
        const dates = loanDates(now);
        this.db.prepare("INSERT INTO loans (id,user_id,book_id,checkout_date,checkout_time,due_iso) VALUES (?,?,?,?,?,?)")
          .run(randomUUID(), userId, id, dates.checkoutDate, dates.checkoutTime, dates.dueISO);
      } else {
        const loan = this.db.prepare("SELECT * FROM loans WHERE id=? AND user_id=? AND returned_at IS NULL").get(id, userId) as LoanRow | undefined;
        if (!loan) throw new Error("Empréstimo não encontrado ou já devolvido.");
        if (action === "return") this.db.prepare("UPDATE loans SET returned_at=? WHERE id=?").run(now.toISOString(), id);
        else {
          if (loan.renewed) throw new Error("Este empréstimo já foi renovado.");
          const due = new Date(`${loan.due_iso}T12:00:00Z`); due.setUTCDate(due.getUTCDate() + 15);
          this.db.prepare("UPDATE loans SET due_iso=?,renewed=1 WHERE id=?").run(due.toISOString().slice(0,10), id);
        }
      }
    });
    return this.snapshot(userId);
  }
  close() { this.db.close(); }
}
let instance: LibraryStore | undefined;
export function libraryStore() { return instance ??= new LibraryStore(resolve(process.env["LIBRARY_DB_PATH"] || ".next/database/data/library.sqlite")); }

