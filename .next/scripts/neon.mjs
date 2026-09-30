import { resolve } from "node:path";
import { postgresDatabase, initializeDatabase } from "../src/database/postgres.server.ts";
import { readLocalData, importLocalData } from "../src/database/migrate.server.ts";
import { PostgresAuthStore } from "../src/auth/postgres.server.ts";
import { normalizePhone } from "../../src/lib/auth.ts";

const command = process.argv[2];
let connection;
try {
  if (command === "migrate") {
    const data = readLocalData(resolve(process.env.LIBRARY_DB_PATH || ".next/database/data/library.sqlite"));
    console.log(`Origem: ${data.users.length} usuários, ${data.books.length} livros, ${data.loans.length} empréstimos, ${data.admin_phones.length} administradores.`);
    if (!process.argv.includes("--apply")) {
      console.log("Somente conferência. Para importar para um Neon vazio, execute com --apply. O SQLite será preservado.");
      process.exit(0);
    }
    if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL no arquivo .env.local.");
    connection = postgresDatabase(process.env.DATABASE_URL);
    await initializeDatabase(connection.database);
    await importLocalData(connection.database, data, process.argv.includes("--preserve-online-users"));
    console.log("Migração concluída. Senhas e histórico preservados. Entre novamente no site para criar uma nova sessão.");
  } else if (command === "check" || command === "admin") {
    if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL no arquivo .env.local.");
    connection = postgresDatabase(process.env.DATABASE_URL);
    await initializeDatabase(connection.database);
    if (command === "admin") {
      await new PostgresAuthStore(connection.database).grantAdmin(normalizePhone(process.argv[3] || ""));
      console.log("Acesso administrativo autorizado para a conta existente.");
    } else console.log("Conexão Neon e estrutura do banco verificadas.");
  } else throw new Error("Use check, migrate [--apply] ou admin TELEFONE_COM_DDD.");
} catch (error) {
  // PostgreSQL errors can contain personal data or connection details; never print them verbatim.
  const message = error instanceof Error ? error.message : "";
  console.error(/^(Configure DATABASE_URL|O banco de destino|Cadastre a conta|Use check)/.test(message) ? message : "Operação não concluída. Confira a conexão, as permissões e o arquivo SQLite. Nenhuma credencial foi exibida.");
  process.exitCode = 1;
} finally { if (connection) await connection.close(); }
