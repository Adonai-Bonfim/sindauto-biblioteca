import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { bookInput } from "../../.next/src/books/schema";
import { libraryStore } from "../../.next/src/books/store.server";
import { requireAdmin } from "../../.next/src/auth/session.server";

export const removeBook = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1).max(100), revision: z.number().int().positive() }))
  .handler(({ data }) => {
    try {
      requireAdmin();
      libraryStore().remove(data.id, data.revision);
      return { ok: true as const };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : "Não foi possível remover o livro." };
    }
  });

export const saveBook = createServerFn({ method: "POST" })
  .validator(z.object({ book: bookInput, id: z.string().min(1).max(100).optional(), revision: z.number().int().positive().optional() }))
  .handler(({ data }) => {
    try {
      requireAdmin();
      const id = libraryStore().save(data.book, data.id, data.revision);
      return { ok: true as const, id };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : "Não foi possível salvar o livro." };
    }
  });
