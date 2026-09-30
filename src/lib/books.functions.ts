import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { bookInput } from "../../.next/src/books/schema";
import { getLibraryStore } from "../../.next/src/database/stores.server";
import { requireAdmin } from "../../.next/src/auth/session.server";

export const removeBook = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1).max(100), revision: z.number().int().positive() }))
  .handler(async ({ data }) => {
    try {
      await requireAdmin();
      await (await getLibraryStore()).remove(data.id, data.revision);
      return { ok: true as const };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : "Não foi possível remover o livro." };
    }
  });

export const saveBook = createServerFn({ method: "POST" })
  .validator(z.object({ book: bookInput, id: z.string().min(1).max(100).optional(), revision: z.number().int().positive().optional() }))
  .handler(async ({ data }) => {
    try {
      await requireAdmin();
      const id = await (await getLibraryStore()).save(data.book, data.id, data.revision);
      return { ok: true as const, id };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : "Não foi possível salvar o livro." };
    }
  });
