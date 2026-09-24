import atomicos from "@/assets/habitos-atomicos.jpg";
import essencialismo from "@/assets/essencialismo.jpg";
import emocional from "@/assets/inteligencia-emocional.jpg";
import porque from "@/assets/comece-pelo-porque.jpg";

export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  status: "Disponível" | "Emprestado";
  availableAgain?: string | undefined;
  description: string;
  cover: string;
};

export const categories = ["Todos", "Liderança", "Tecnologia", "Desenvolvimento", "Sustentabilidade"];

export const books: Book[] = [
  {
    id: "habitos-atomicos",
    title: "Hábitos Atômicos",
    author: "James Clear",
    category: "Desenvolvimento",
    status: "Disponível",
    description: "Um método comprovado para criar bons hábitos, abandonar os maus e alcançar resultados extraordinários por meio de pequenas mudanças diárias.",
    cover: atomicos,
  },
  {
    id: "essencialismo",
    title: "Essencialismo",
    author: "Greg McKeown",
    category: "Desenvolvimento",
    status: "Disponível",
    description: "Uma abordagem disciplinada para fazer menos, porém melhor, e concentrar energia no que realmente importa.",
    cover: essencialismo,
  },
  {
    id: "inteligencia-emocional",
    title: "Inteligência Emocional",
    author: "Daniel Goleman",
    category: "Desenvolvimento",
    status: "Disponível",
    description: "Uma exploração prática de como reconhecer e conduzir as emoções no trabalho e na vida.",
    cover: emocional,
  },
  {
    id: "comece-pelo-porque",
    title: "Comece pelo Porquê",
    author: "Simon Sinek",
    category: "Liderança",
    status: "Disponível",
    description: "Como grandes líderes inspiram pessoas a agir ao comunicar propósito antes de produtos ou processos.",
    cover: porque,
  },
];

export type Loan = {
  id: string;
  book: Book;
  checkoutDate: string;
  checkoutTime: string;
  dueDate: string;
  status: "ativo" | "devolvido" | "atrasado" | "renovado";
  renewed: boolean;
};
