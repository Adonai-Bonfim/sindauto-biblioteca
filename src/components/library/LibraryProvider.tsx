import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Book, type Loan } from "@/lib/library-data";
import { useAuth } from "./AuthProvider";
import { readPrototypeLoans, changePrototypeLoan } from "@/lib/prototype-loans.functions";

type LibraryContextValue = {
  books: Book[]; loans: Loan[]; busy: boolean; ready: boolean;
  refresh: () => Promise<void>;
  borrow: (book: Book) => Promise<Loan | undefined>;
  renew: (id: string) => Promise<void>; returnBook: (id: string) => Promise<void>;
};
const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);
export function LibraryProvider({ children }: { children: ReactNode }) {
  const user = useAuth();
  const client = useQueryClient();
  const key = ["prototype-loans", user.id];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({ queryKey: key, queryFn: () => readPrototypeLoans(), refetchInterval: 2000, refetchOnWindowFocus: "always" });
  const books: Book[] = query.data?.books ?? [];
  const loans: Loan[] = (query.data?.loans ?? []).flatMap(loan => {
    const book = books.find(item => item.id === loan.bookId);
    return book ? [{ ...loan, book }] : [];
  });
  async function change(action: "borrow" | "renew" | "return", id: string) {
    setBusy(true); setError("");
    try {
      await client.cancelQueries({ queryKey: key });
      const result = await changePrototypeLoan({ data: { action, id } });
      if (!result.ok) throw new Error(result.message);
      client.setQueryData(key, result.snapshot);
      return result.snapshot;
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível conectar ao servidor. Tente novamente."); return undefined; }
    finally { setBusy(false); void client.invalidateQueries({ queryKey: key }); }
  }
  return <LibraryContext.Provider value={{ books, loans, busy, ready: Boolean(query.data) && !query.isError,
    refresh: async () => { await client.invalidateQueries({ queryKey: key }); },
    borrow: async book => {
      const result = await change("borrow", book.id);
      const loan = result?.loans.find(item => item.bookId === book.id && item.status !== "devolvido");
      return loan ? { ...loan, book } : undefined;
    },
    renew: async id => { await change("renew", id); },
    returnBook: async id => { await change("return", id); },
  }}>
    {(error || query.isError) && <div role="alert" className="sticky top-0 z-50 bg-danger-soft p-3 text-center text-sm text-primary">{error || "Sem conexão com o servidor. Não foi possível atualizar a disponibilidade."}</div>}
    {children}
  </LibraryContext.Provider>;
}
export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used within LibraryProvider");
  return context;
}
