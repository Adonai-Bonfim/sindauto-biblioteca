import assert from "node:assert/strict";
import { toJSON, fromCrossJSON } from "seroval";

// Use with vite preview (workerd). Synthetic invalid cookie forces a read-only
// session lookup without creating users, sessions, or changing any records.
const base = "http://127.0.0.1:4174";
const id = "b8f08dcb4f4e01ec762540a2413f69c18b1ee2ab98b7bea61b38af901883c44c";
const payload = encodeURIComponent(JSON.stringify(toJSON({ data: undefined })));
for (const cookie of ["", "sindauto_session=diagnostic-invalid-session"]) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const start = Date.now();
    const response = await fetch(`${base}/_serverFn/${id}?payload=${payload}`, {
      headers: { "x-tsr-serverFn": "true", referer: `${base}/`, cookie },
      signal: AbortSignal.timeout(30_000),
    });
    const body = fromCrossJSON(await response.json(), {});
    console.log(`readSession ${cookie ? "database" : "anonymous"} ${attempt}: HTTP ${response.status}, ${Date.now() - start}ms, error=${Boolean(body.error)}`);
    assert.equal(response.status, 200);
    assert.equal(Boolean(body.error), false, "Server function returned an error (details omitted)");
    assert.equal(body.result, null);
  }
}
