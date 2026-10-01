import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_MISSING");
const built = await build({
  stdin: { resolveDir: process.cwd(), contents: `
    import { Pool } from 'pg';
    let pool;
    export default { async fetch(request, env) {
      pool ??= new Pool({connectionString:env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:15000,allowExitOnIdle:true});
      pool.on('error',()=>{});
      console.log('[baseline] before pool.connect');
      const client = await pool.connect();
      console.log('[baseline] after pool.connect');
      try {
        console.log('[baseline] before client.query SELECT');
        await client.query('SELECT 1');
        console.log('[baseline] after client.query SELECT');
        return new Response('ok');
      } finally {client.release();}
    }};
  ` },
  bundle: true, format: "esm", platform: "node", conditions: ["workerd"],
  external: ["node:*", "cloudflare:*", "pg-native"], write: false,
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire("/baseline.mjs");' },
});
const runtime = new Miniflare(convertV4MiniflareOptions({
  modules: true, script: built.outputFiles[0].text, modulesRoot: process.cwd(),
  compatibilityDate: "2026-10-01", compatibilityFlags: ["nodejs_compat"],
  bindings: { DATABASE_URL: process.env.DATABASE_URL },
}));
try {
  for (let i = 1; i <= 3; i++) {
    let timer;
    try {
      const response = await Promise.race([
        runtime.dispatchFetch('http://localhost/'),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('TIMEOUT')), 20_000); }),
      ]);
      console.log(`baseline ${i}: HTTP ${response.status}`);
      await response.text();
    } catch { console.log(`baseline ${i}: failed (raw error omitted)`); break; }
    finally { clearTimeout(timer); }
  }
} finally { await runtime.dispose(); }
