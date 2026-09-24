import { hashPrototypePassword } from "./prototype-password";
import { bytesToHex, randomBytes } from "@noble/hashes/utils.js";
import { normalizePhone } from "./auth";

export type PrototypeUser = {
  id: string;
  phone: string;
  user_metadata: { name: string; first_name: string; last_name: string; department: string };
};
type Account = { user: PrototypeUser; salt: string; hash: string };
const ACCOUNTS = "sindauto.prototype.accounts.v1";
const SESSION = "sindauto.prototype.session.v1";
export const PROTOTYPE_AUTH_EVENT = "sindauto-prototype-auth";

function accounts(): Account[] {
  return JSON.parse(localStorage.getItem(ACCOUNTS) || "[]");
}
async function hashPassword(password: string, salt: string) {
  return hashPrototypePassword(password, salt);
}
function openSession(user: PrototypeUser) {
  localStorage.setItem(SESSION, user.id);
  window.dispatchEvent(new Event(PROTOTYPE_AUTH_EVENT));
}
export function getPrototypeUser(): PrototypeUser | null {
  const id = localStorage.getItem(SESSION);
  return id ? accounts().find(account => account.user.id === id)?.user ?? null : null;
}
export async function signUpPrototype(phone: string, password: string, metadata: PrototypeUser["user_metadata"]) {
  phone = normalizePhone(phone);
  if (password.length < 8) throw new Error("Use pelo menos 8 caracteres na senha.");
  const salt = bytesToHex(randomBytes(16));
  const hash = await hashPassword(password, salt);
  const current = accounts();
  if (current.some(account => account.user.phone === phone)) throw new Error("Este telefone já está cadastrado neste navegador. Use Entrar.");
  const user = { id: bytesToHex(randomBytes(16)), phone, user_metadata: metadata };
  localStorage.setItem(ACCOUNTS, JSON.stringify([...current, { user, salt, hash }]));
  openSession(user);
}
export async function signInPrototype(phone: string, password: string) {
  const account = accounts().find(item => item.user.phone === normalizePhone(phone));
  if (!account || await hashPassword(password, account.salt) !== account.hash) throw new Error("Telefone ou senha incorretos. Confira e tente novamente.");
  openSession(account.user);
}
export function signOutPrototype() {
  localStorage.removeItem(SESSION);
  window.dispatchEvent(new Event(PROTOTYPE_AUTH_EVENT));
}
