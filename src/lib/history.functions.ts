import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "../../.next/src/auth/session.server";
import { getLibraryStore } from "../../.next/src/database/stores.server";

export const readAdminHistory = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await requireAdmin();
    return { ok: true as const, history: await (await getLibraryStore()).adminHistory() };
  } catch {
    return { ok: false as const, message: "Não foi possível acessar os registros. Entre com uma conta de administrador e tente novamente." };
  }
});
