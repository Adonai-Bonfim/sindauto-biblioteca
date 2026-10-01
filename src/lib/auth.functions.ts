import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizePhone } from "./auth";
import { getAuthStore } from "../../.next/src/database/stores.server";
import { currentUser, startSession, endSession } from "../../.next/src/auth/session.server";
import { traceStage } from "./server-diagnostics.server";

function logAccessFailure(operation: string, error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  // Only known-safe identifiers; raw errors may include credentials or personal data.
  const safeCode = /^[A-Z0-9_]{2,40}$/.test(code) ? code : error instanceof Error && error.message === "DATABASE_URL_MISSING" ? "DATABASE_URL_MISSING" : "ACCESS_SERVICE_FAILURE";
  console.error(`[auth:${operation}] ${safeCode}`);
}

const phone = z.string().max(22).transform((value, ctx) => {
  try { return normalizePhone(value); }
  catch { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe um telefone com DDD." }); return z.NEVER; }
});
const credentials = z.object({ phone, password: z.string().min(1).max(128) });
const signup = credentials.extend({ password: z.string().min(8).max(128), metadata: z.object({
  first_name: z.string().trim().min(1).max(80), last_name: z.string().trim().min(1).max(120), department: z.string().trim().min(1).max(100),
}) });
export const registerUser = createServerFn({ method: "POST" }).validator(signup).handler(async ({ data }) => {
  try {
    const user = await (await getAuthStore()).register(data.phone, data.password, { ...data.metadata, name: `${data.metadata.first_name} ${data.metadata.last_name}` });
    await startSession(user.id);
    return { ok: true as const, user };
  } catch (error) {
    if (!(error instanceof Error && error.message.startsWith("Este telefone"))) logAccessFailure("register", error);
    return { ok: false as const, message: error instanceof Error && error.message.startsWith("Este telefone") ? error.message : "Não foi possível salvar o cadastro. Tente novamente." };
  }
});
export const loginUser = createServerFn({ method: "POST" }).validator(credentials).handler(async ({ data }) => {
  try {
    const user = await (await getAuthStore()).login(data.phone, data.password);
    await startSession(user.id);
    return { ok: true as const, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/^(Telefone ou senha|Muitas tentativas)/.test(message)) logAccessFailure("login", error);
    return { ok: false as const, message: /^(Telefone ou senha|Muitas tentativas)/.test(message) ? message : "Não foi possível entrar. Tente novamente." };
  }
});
export const readSession = createServerFn({ method: "GET" }).handler(() => traceStage("readSession", currentUser, 25_000));
export const logoutUser = createServerFn({ method: "POST" }).handler(async () => { await endSession(); return { ok: true }; });
