import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "../../.next/src/auth/session.server";
import { libraryStore } from "../../.next/src/books/store.server";

export const readAdminHistory = createServerFn({ method: "GET" }).handler(() => {
  try {
    requireAdmin();
    return { ok: true as const, history: libraryStore().adminHistory() };
  } catch {
    return { ok: false as const, message: "Não foi possível acessar os registros. Entre com uma conta de administrador e tente novamente." };
  }
});
