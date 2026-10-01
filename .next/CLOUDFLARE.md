# Cloudflare Workers — build e runtime

O deploy principal usa o plugin oficial `@cloudflare/vite-plugin`, com o ambiente
`ssr`, antes de `tanstackStart()`. `wrangler.jsonc` usa `nodejs_compat` e a entrada
`@tanstack/react-start/server-entry`. A entrada customizada `src/server.ts` continua
selecionada pelo TanStack, preservando o tratamento de erros existente.

## Publicação

- Instalação: `bun install --frozen-lockfile`.
- Build: `npm run build`.
- Deploy: `npm run deploy` (executa `wrangler deploy`).
- Worker: `adonai-bonfim-sindauto-biblioteca`, o nome gerado anteriormente pelo Nitro.
  Se o Worker no painel tiver outro nome, alinhe o campo `name` antes do deploy.
- Saídas: `dist/client` e `dist/server`. O plugin gera a configuração de deploy
  em `.wrangler/deploy/config.json`, usada pelo Wrangler.
- Preserve o segredo `DATABASE_URL` no Worker; não coloque credenciais no Wrangler.
  Não envie `.env.local`, `.dev.vars`, `dist` ou `.output` para o Git.

O deploy não usa Nitro, `vercel.json` nem o artefato antigo `.output/server`.
Remova comandos/variáveis do painel que ainda selecionem o preset Nitro/Vercel.
O banco e os componentes visuais não foram modificados nesta correção.

## Reprodução e verificação

Antes da correção, `NITRO_PRESET=cloudflare_module npm run build` produzia chunks
`_libs/@radix-ui/react-collection+[…].mjs`. Ao executá-los com Wrangler local, GET `/`
retornava HTTP 500: `TypeError: __commonJSMin is not a function`, linha 13.
O helper CommonJS estava no chunk `createServerFn`, que importava o router,
que dependia do chunk React/Radix. O ciclo avaliava o consumidor antes da atribuição
do helper. Não havia versões duplicadas de collection, slot ou primitive.

Versões verificadas com `npm ls`: Vite 8.1.5, TanStack Start 1.168.32,
Cloudflare Vite plugin 1.62.3, Wrangler 4.145.0, Radix collection 1.1.15,
slot 1.3.3 e primitive 2.1.10. As versões de Vite, TanStack e Radix foram mantidas.

Com o plugin oficial, o Vite faz o build do ambiente Workers diretamente,
sem a segunda etapa de divisão de chunks do Nitro. Não foram adicionados
`ssr.noExternal`, `ssr.external`, `optimizeDeps` ou regras manuais para Radix.

```sh
npm run build
npm run typecheck
npm run preview -- --host 127.0.0.1 --port 4174
# Em outro terminal:
npm run test:worker
```

O smoke test usa somente GET anônimo e verifica cinco rotas SSR e os assets,
sem realizar operações no banco. Ele não testa login ou o Neon em produção.

O backend Node/SQLite continua disponível para os testes isolados existentes,
por uma configuração separada que não participa do deploy Workers:

```sh
bun run build:node
bun run test:backend
```
