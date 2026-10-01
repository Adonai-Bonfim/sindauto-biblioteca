import { test, expect } from "bun:test";
import { allowFetchSite } from "../src/lib/csrf.ts";
const request = headers => new Request("https://biblioteca.example/_serverFn/test", {headers});
test("aceita metadados alternativos somente com origem comprovada", () => {
  expect(allowFetchSite("none", request({origin:"https://biblioteca.example"}))).toBe(true);
  expect(allowFetchSite("same-site", request({referer:"https://biblioteca.example/catalogo"}))).toBe(true);
  expect(allowFetchSite("none", request({}))).toBe(false);
  expect(allowFetchSite("same-site", request({origin:"https://outro.example"}))).toBe(false);
  expect(allowFetchSite("none", request({origin:"null",referer:"https://biblioteca.example/"}))).toBe(false);
  expect(allowFetchSite("none", request({referer:"https://biblioteca.example.attacker.example/"}))).toBe(false);
  expect(allowFetchSite("cross-site", request({origin:"https://biblioteca.example"}))).toBe(false);
});
