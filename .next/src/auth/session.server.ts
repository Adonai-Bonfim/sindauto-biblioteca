import { getCookie, setCookie, deleteCookie, getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { getAuthStore } from "../database/stores.server";
import { traceStage } from "../../../src/lib/server-diagnostics.server";
const SESSION_SECONDS = 30 * 24 * 60 * 60;

const COOKIE = "sindauto_session";
export async function currentUser() {
  setResponseHeader("Cache-Control", "no-store");
  const token = getCookie(COOKIE);
  if (!token) return null;
  const store = await traceStage("session.store", getAuthStore);
  return traceStage("session.getUser", () => store.getUser(token), 23_000);
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) throw new Error("Somente administradores podem gerenciar o acervo.");
  return user;
}
export async function startSession(userId: string) {
  const store = await getAuthStore();
  await store.logout(getCookie(COOKIE));
  setCookie(COOKIE, await store.createSession(userId), {
    httpOnly: true, sameSite: "lax", secure: new URL(getRequest().url).protocol === "https:", path: "/", maxAge: SESSION_SECONDS,
  });
}
export async function endSession() {
  await (await getAuthStore()).logout(getCookie(COOKIE));
  deleteCookie(COOKIE, { path: "/" });
}
