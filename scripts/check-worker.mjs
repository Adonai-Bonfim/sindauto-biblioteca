// Run after npm run build and npm run preview -- --host 127.0.0.1 --port 4174.
// Anonymous requests only: no login, database queries, or writes.
import assert from "node:assert/strict";

const base = "http://127.0.0.1:4174";
const assets = new Set();
for (const path of ["/", "/admin", "/catalogo", "/meus-livros", "/perfil"]) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(15_000) });
  assert.equal(response.status, 200, `${path} deve responder HTTP 200 no runtime Workers`);
  const body = await response.text();
  assert.match(body, /<!doctype html>/i, `${path} deve renderizar HTML`);
  assert.doesNotMatch(body, /__commonJSMin is not a function|Internal Server Error/);
  for (const match of body.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g)) assets.add(match[1]);
  console.log(`${path}: HTTP 200, SSR sem erro CommonJS`);
}
assert.ok(assets.size > 0, "O SSR deve referenciar assets do cliente");
for (const path of assets) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(15_000) });
  assert.equal(response.status, 200, `${path} deve estar disponível`);
  assert.doesNotMatch(response.headers.get("content-type") || "", /text\/html/, "Assets não devem retornar o HTML de fallback");
}
console.log(`${assets.size} assets JS/CSS disponíveis no preview.`);
