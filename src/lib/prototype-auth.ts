import { registerUser, loginUser, readSession, logoutUser } from "./auth.functions";
import type { LibraryUser } from "../../.next/src/users/types";
export type PrototypeUser = LibraryUser;
export const PROTOTYPE_AUTH_EVENT = "sindauto-auth";
export async function getPrototypeUser() { return readSession(); }
function changed() { window.dispatchEvent(new Event(PROTOTYPE_AUTH_EVENT)); }
export async function signUpPrototype(phone: string, password: string, metadata: LibraryUser["user_metadata"]) {
  const result = await registerUser({ data: { phone, password, metadata } });
  if (!result.ok) throw new Error(result.message);
  changed();
}
export async function signInPrototype(phone: string, password: string) {
  const result = await loginUser({ data: { phone, password } });
  if (!result.ok) throw new Error(result.message);
  changed();
}
export async function signOutPrototype() {
  await logoutUser();
  changed();
}
