import assert from "node:assert/strict";
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL em .env.local para o teste de leitura.");
const result = await build({
  stdin: { resolveDir: process.cwd(), sourcefile: "worker-database-check.mjs", contents: `
    import { postgresDatabase } from './.next/src/database/postgres.server.ts';
    import { scryptSync } from 'node:crypto';
    let connection;
    export default { async fetch(request, env) {
      try {
        if (new URL(request.url).pathname === '/crypto') {
          return Response.json({ok:scryptSync('fixture-password','fixture-salt',64).length===64});
        }
        connection ??= postgresDatabase(env.DATABASE_URL);
        if (new URL(request.url).pathname === '/timeout') {
          const start = Date.now();
          try { await connection.database.query('SELECT pg_sleep(8)'); }
          catch { return Response.json({ok:Date.now()-start<10000}); }
          return Response.json({ok:false});
        }
        const result = new URL(request.url).pathname === '/transaction'
          ? await connection.database.transaction(client => client.query('SELECT 1 AS ok'))
          : await connection.database.query('SELECT 1 AS ok');
        return Response.json({ok:result.rows[0].ok===1});
      } catch { return Response.json({ok:false}, {status:500}); }
    }};
  ` },
  bundle: true, format: "esm", platform: "node", conditions: ["workerd"],
  external: ["node:*", "cloudflare:*", "pg-native"], write: false,
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire("/worker-database-check.mjs");' },
});
const runtime = new Miniflare(convertV4MiniflareOptions({
  modules: true, script: result.outputFiles[0].text, modulesRoot: process.cwd(),
  compatibilityDate: "2026-10-01", compatibilityFlags: ["nodejs_compat"],
  bindings: { DATABASE_URL: process.env.DATABASE_URL },
}));
async function check(path) {
  const response = await runtime.dispatchFetch(`http://localhost${path}`);
  assert.equal(response.status, 200, `${path}: falha na conexão entre requisições Workers`);
  assert.equal((await response.json()).ok, true);
}
try {
  await check("/crypto");
  for (let i = 0; i < 3; i++) { await check("/query"); await check("/transaction"); }
  await Promise.all([check("/query"), check("/transaction"), check("/query")]);
  await check("/timeout");
  await check("/query");
  console.log("Workers: criptografia e 9 consultas SELECT 1 passaram em requisições sequenciais e concorrentes. Nenhum registro alterado.");
} finally { await runtime.dispose(); }
