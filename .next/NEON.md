# Neon e Vercel

O backend usa PostgreSQL quando `DATABASE_URL` está definida. Sem essa variável,
o desenvolvimento local continua usando SQLite. Na Vercel, a ausência da variável
é um erro de configuração: o sistema não tenta criar SQLite nem usar `/tmp`.

## Configurar e migrar

1. Crie um projeto no Neon e obtenha a conexão **pooled** no botão **Connect**.
2. Na raiz deste projeto, crie `.env.local` com `DATABASE_URL` contendo essa conexão,
   inclusive os parâmetros SSL fornecidos pelo Neon. O arquivo é ignorado pelo Git.
   Não use prefixo `VITE_`, pois a conexão é secreta e exclusiva do servidor.
3. Use Node.js 24. Execute `bun run db:check` para verificar a conexão e criar as tabelas.
4. Execute `bun run db:migrate` para conferir somente as quantidades locais.
5. Antes de receber novos cadastros no Neon, execute `bun run db:migrate --apply`.
   Interrompa novas retiradas/cadastros locais durante essa transferência para evitar
   alterações após a leitura. O banco Neon deve estar vazio.
6. Na Vercel, configure a mesma `DATABASE_URL` em **Settings → Environment Variables**,
   no ambiente **Production**. Use um banco/branch Neon separado para Preview.
7. Faça um novo deploy. Use o framework **TanStack Start**, Node.js 24 e
   `npm run build`; deixe Output Directory sem override.
8. Entre no site com o mesmo telefone e senha e confira os livros e o histórico.

Não adicione a URL da conexão ao código, ao GitHub ou a mensagens. Não execute
a migração automaticamente no build. O build não precisa acessar o banco.

## O que a migração preserva

Usuários, IDs, hashes e salts das senhas, administradores já cadastrados, todos os
livros (incluindo removidos), estoque, datas, renovações e devoluções.
Sessões antigas não são copiadas: entre novamente após a mudança.
O SQLite original é aberto somente para leitura e permanece no computador.
A importação acontece em uma transação; uma falha desfaz todas as inserções.
Uma segunda execução com destino preenchido é recusada, sem sobrescrever dados.

Se o Neon já tiver contas, mas ainda não tiver livros nem empréstimos, use
`bun run db:migrate --apply --preserve-online-users`. Nesse modo, contas com o
mesmo telefone mantêm sua senha, seus dados e suas sessões online. O histórico
local é vinculado ao ID da conta online, e os administradores locais são
preservados. Livros ou empréstimos existentes no destino continuam bloqueando
a importação para evitar duplicação ou sobrescrita.

Para outra conta de administrador, cadastre-a primeiro e execute:

```sh
bun run db:admin TELEFONE_COM_DDD
```

A migração já preserva o administrador existente; não é necessário recriá-lo.
Um Neon novo não recebe livros de demonstração automaticamente.

## Validação

```sh
bun test tests
bun run typecheck
bun run build
bun run test:backend
```

Os testes PostgreSQL usam PGlite em memória, com o mesmo SQL dos repositórios,
sem acessar o Neon real. Cobrem migração, rollback, senha antiga, sessões,
limite de tentativas, permissões de propriedade e estoque concorrente.
Os testes HTTP verificam os controles de administrador com SQLite temporário.
`db:check` verifica a conexão real; a validação final no site depende do deploy
com a variável configurada e da migração aplicada.
