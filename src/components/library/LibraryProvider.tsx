import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { books, type Book, type Loan } from "@/lib/library-data";

type LibraryContextValue = {
  loans: Loan[];
  borrow: (book: Book) => Loan;
  renew: (id: string) => void;
  returnBook: (id: string) => void;
};

const demoBook = books.find((book) => book.id === "inteligencia-emocional");

const initialLoan: Loan | undefined = demoBook ? {
  id: "loan-demo",
  book: demoBook,
  checkoutDate: "01/10/2026",
  checkoutTime: "09:15",
  dueDate: "08/10/2026",
  status: "ativo",
  renewed: false,
} : undefined;

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [loans, setLoans] = useState<Loan[]>(initialLoan ? [initialLoan] : []);

  const value = useMemo<LibraryContextValue>(() => ({
    loans,
    borrow: (book) => {
      const loan: Loan = {
        id: `loan-${Date.now()}`,
        book,
        checkoutDate: "23/09/2026",
        checkoutTime: "14:32",
        dueDate: "08/10/2026",
        status: "ativo",
        renewed: false,
      };
      setLoans((current) => [loan, ...current]);
      return loan;
    },
    renew: (id) => setLoans((current) => current.map((loan) => loan.id === id && !loan.renewed
      ? { ...loan, renewed: true, status: "renovado", dueDate: "23/10/2026" }
      : loan)),
    returnBook: (id) => setLoans((current) => current.map((loan) => loan.id === id
      ? { ...loan, status: "devolvido" }
      : loan)),
  }), [loans]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used within LibraryProvider");
  return context;
}