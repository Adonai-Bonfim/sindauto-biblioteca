import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizePhone } from "./auth";
import { authStore } from "../../.next/src/auth/store.server";
import { currentUser, startSession, endSession } from "../../.next/src/auth/session.server";

const phone = z.string().max(22).transform((value, ctx) => {
  try { return normalizePhone(value); }
  catch { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe um telefone com DDD." }); return z.NEVER; }
});
const credentials = z.object({ phone, password: z.string().min(1).max(128) });
const signup = credentials.extend({ password: z.string().min(8).max(128), metadata: z.object({
  first_name: z.string().trim().min(1).max(80), last_name: z.string().trim().min(1).max(120), department: z.string().trim().min(1).max(100),
}) });
export const registerUser = createServerFn({ method: "POST" }).validator(signup).handler(({ data }) => {
  try {
    const user = authStore().register(data.phone, data.password, { ...data.metadata, name: `${data.metadata.first_name} ${data.metadata.last_name}` });
    startSession(user.id);
    return { ok: true as const, user };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error && error.message.startsWith("Este telefone") ? error.message : "Não foi possível salvar o cadastro. Tente novamente." };
  }
});
export const loginUser = createServerFn({ method: "POST" }).validator(credentials).handler(({ data }) => {
  try {
    const user = authStore().login(data.phone, data.password);
    startSession(user.id);
    return { ok: true as const, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return { ok: false as const, message: /^(Telefone ou senha|Muitas tentativas)/.test(message) ? message : "Não foi possível entrar. Tente novamente." };
  }
});
export const readSession = createServerFn({ method: "GET" }).handler(() => currentUser());
export const logoutUser = createServerFn({ method: "POST" }).handler(() => { endSession(); return { ok: true }; });
