import { getCookie, setCookie, deleteCookie, getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { authStore, SESSION_SECONDS } from "./store.server";

const COOKIE = "sindauto_session";
export function currentUser() {
  setResponseHeader("Cache-Control", "no-store");
  return authStore().getUser(getCookie(COOKIE));
}
export function requireUser() {
  const user = currentUser();
  if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
  return user;
}
export function requireAdmin() {
  const user = requireUser();
  if (!user.isAdmin) throw new Error("Somente administradores podem gerenciar o acervo.");
  return user;
}
export function startSession(userId: string) {
  authStore().logout(getCookie(COOKIE));
  setCookie(COOKIE, authStore().createSession(userId), {
    httpOnly: true, sameSite: "lax", secure: new URL(getRequest().url).protocol === "https:", path: "/", maxAge: SESSION_SECONDS,
  });
}
export function endSession() {
  authStore().logout(getCookie(COOKIE));
  deleteCookie(COOKIE, { path: "/" });
}
