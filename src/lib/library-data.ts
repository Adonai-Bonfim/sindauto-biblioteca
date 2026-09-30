export type { StoredBook as Book } from "../../.next/src/books/schema";
import type { StoredBook } from "../../.next/src/books/schema";
export const categories = ["Todos", "Liderança", "Tecnologia", "Desenvolvimento", "Sustentabilidade"];
export type Loan = {
  id: string;
  book: StoredBook;
  checkoutDate: string;
  checkoutTime: string;
  dueDate: string;
  returnedAt?: string | null;
  status: "ativo" | "devolvido" | "atrasado" | "renovado";
  renewed: boolean;
};
