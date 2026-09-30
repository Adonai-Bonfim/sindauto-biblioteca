import { z } from "zod";

export const bookInput = z.object({
  title: z.string().trim().min(1, "Informe o título.").max(200),
  author: z.string().trim().min(1, "Informe o autor.").max(160),
  category: z.string().trim().min(1, "Informe a categoria.").max(80),
  description: z.string().trim().max(4000).default(""),
  cover: z.string().trim().max(2048).refine(value => !value || /^https?:\/\/[^\s]+$/i.test(value) || /^\/books\/[a-z0-9-]+\.(jpg|png|webp|svg)$/i.test(value), "Use um endereço de imagem HTTP ou HTTPS válido.").default(""),
  quantity: z.number().int().min(0).max(10000),
});
export type BookInput = z.infer<typeof bookInput>;
export type StoredBook = BookInput & {
  id: string; availableCount: number; status: "Disponível" | "Emprestado" | "Sem estoque";
  availableAgain?: string | undefined; revision: number;
};
