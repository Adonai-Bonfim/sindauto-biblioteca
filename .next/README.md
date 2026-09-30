# Backend da Biblioteca Sindauto

Backend integrado ao TanStack Start, executado em Node.js 24. Usuários, sessões,
livros, estoque, empréstimos e histórico são persistidos em SQLite, sem Supabase.

## Módulos

- `src/auth`: cadastro, login, sessões e saída.
- `src/users`: cadastro e dados dos usuários.
- `src/books`: cadastro dos livros, exemplares e estoque.
- `src/books/store.server.ts`: estoque, retirada, renovação, devolução e histórico.
- `database/data`: banco SQLite e arquivos auxiliares, ignorados pelo Git.
- `tests`: testes do backend.

## Regras implementadas

- Armazenar apenas hashes de senha, nunca senhas em texto puro.
- Identificar o usuário pela sessão autenticada no servidor.
- Restringir cadastro e alteração do estoque aos administradores.
- Registrar retirada e disponibilidade do exemplar na mesma transação.
- Manter o livro visível com a data prevista enquanto estiver emprestado.
- Liberar o exemplar somente quando a devolução for registrada.
- Preservar o histórico em banco persistente, inclusive após reiniciar o servidor.
- Cada usuário consulta apenas seus próprios empréstimos.

## Uso e administração

Cadastre-se com telefone e senha. Para autorizar um administrador, execute no
computador do servidor:

```sh
node .next/scripts/admin.mjs TELEFONE_COM_DDD
```

Depois, entre com esse telefone e abra **Perfil → Gerenciar livros e estoque**
(rota `/admin`). O telefone pode ser autorizado antes do cadastro. Nenhuma senha
é criada automaticamente, e o privilégio fica salvo no banco.

As contas antigas da simulação no navegador não são importadas automaticamente.
Cadastre o telefone uma vez no backend; depois use-o em qualquer dispositivo
conectado ao mesmo servidor. A sessão permanece por até 30 dias ou até sair.

## Persistência e backup

O arquivo `.next/database/data/library.sqlite` é criado automaticamente. Defina
`LIBRARY_DB_PATH` com um caminho absoluto para usar outro local. Preserve esse
volume na hospedagem. Para um backup simples, pare os servidores e copie toda
a pasta `database/data` antes de reiniciar. Dados pessoais não vão para o GitHub.

Os quatro títulos de demonstração são inseridos apenas se ainda não existirem.
A quantidade considera o total de exemplares: não pode ser reduzida abaixo da
quantidade emprestada. Uma devolução libera um exemplar; vencer o prazo não libera.

## Verificação

```sh
bun test tests
bun run typecheck
bun run build
bun run test:backend
```

Os testes do backend usam bancos temporários e a porta 3198. Verificam cadastro,
sessão após reinício, acesso de outro dispositivo, permissões, estoque e histórico.
Execute o build antes de `test:backend`. Use HTTPS na hospedagem. Recuperação de
senha e painel global de histórico administrativo não fazem parte desta etapa.

Esta pasta é código-fonte próprio deste projeto Vite/TanStack. Não executar
Next.js usando este mesmo diretório de saída, pois ele pode sobrescrever `.next`.
