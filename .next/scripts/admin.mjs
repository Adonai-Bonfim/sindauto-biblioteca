import { resolve } from "node:path";
import { AuthStore } from "../src/auth/store.server.ts";
import { normalizePhone } from "../../src/lib/auth.ts";

const phone = normalizePhone(process.argv[2] || "");
const store = new AuthStore(resolve(process.env.LIBRARY_DB_PATH || ".next/database/data/library.sqlite"));
try { store.grantAdmin(phone); console.log("Acesso administrativo autorizado para o telefone informado."); }
finally { store.close(); }
