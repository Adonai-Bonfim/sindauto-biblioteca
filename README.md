# Biblioteca Sindauto

Sistema web para gestão do acervo e dos empréstimos de livros do Sindauto Bahia. Oferece acesso pelo navegador, inclusive por QR Code, com interface adaptada a celulares, tablets e computadores.

## Funcionalidades

### Colaboradores

- Cadastro com nome, sobrenome, setor, telefone e senha.
- Acesso por telefone e senha.
- Catálogo com capas, pesquisa, categorias e disponibilidade.
- Empréstimos com prazo de 15 dias e uma renovação.
- Registro de devolução e consulta ao histórico pessoal.
- Visualização das datas de retirada, devolução prevista e situação dos empréstimos.

### Administração

- Cadastro, edição e remoção de livros, com controle de quantidade.
- Acompanhamento dos empréstimos com capa, livro, colaborador, setor e telefone.
- Consulta às datas, horários, prazos, renovações e devoluções.
- Filtros por pessoa, livro, situação e período.
- Histórico preservado para acompanhamento do acervo.

O acesso administrativo é validado no servidor e concedido a contas já cadastradas.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Aplicação | React, TypeScript e TanStack Start |
| Rotas e consultas | TanStack Router e TanStack Query |
| Interface | Tailwind CSS, Radix UI e Lucide |
| Banco em produção | PostgreSQL no Neon, com driver pg |
| Hospedagem | Cloudflare Workers |
| Desenvolvimento | Vite e Bun |
| Backend local alternativo | Node.js e SQLite |

## Organização

~~~text
src/
  components/       Componentes e telas da biblioteca
  lib/              Funções de servidor e utilitários
  routes/           Rotas da aplicação
.next/
  src/              Fontes do backend: autenticação, acervo e persistência
  scripts/          Administração e transferência de dados
  tests/            Testes de integração do backend
public/             Imagens e arquivos públicos
scripts/            Verificações do runtime Cloudflare
tests/              Testes da aplicação
wrangler.jsonc      Configuração do Worker
vite.config.ts      Build e desenvolvimento para Cloudflare
vite.node.config.ts Backend Node para testes locais
~~~

Neste projeto, .next/src contém código-fonte versionado do backend. A aplicação utiliza TanStack Start; essa pasta não representa um build de Next.js.

## Desenvolvimento local

Requisitos: Node.js 24 e Bun 1.3 ou superior.

~~~sh
bun install --frozen-lockfile
~~~

Copie .env.example para .env.local na raiz do projeto e preencha DATABASE_URL com uma conexão de um ambiente Neon de desenvolvimento. O arquivo de exemplo contém somente marcadores fictícios.

~~~sh
bun run dev
~~~

Acesse http://localhost:8080. O servidor também escuta na rede local; o acesso por outro dispositivo depende da rede e do firewall.

O ambiente padrão utiliza o runtime Cloudflare e requer DATABASE_URL para operações de banco. O backend Node oferece SQLite como alternativa quando essa variável não está configurada.

## Configuração e proteção de dados

| Variável | Finalidade | Onde configurar |
| --- | --- | --- |
| DATABASE_URL | Conexão PostgreSQL exclusiva do servidor | .env.local no desenvolvimento; Secret do Worker em produção |
| LIBRARY_DB_PATH | Caminho opcional do SQLite no backend Node | Ambiente local |

- Nunca publique conexões reais, senhas, tokens, arquivos de ambiente ou cópias do banco.
- Não use o prefixo VITE_ para credenciais do servidor.
- Mantenha apenas .env.example versionado, com valores fictícios.
- Senhas de usuários são armazenadas como hashes com salt; sessões usam cookies HttpOnly.
- Utilize um banco separado para testes e faça backup antes de transferir dados.
- Credenciais expostas devem ser substituídas no provedor e nos ambientes que as utilizam.

## Cloudflare Workers

A configuração de build está em vite.config.ts e wrangler.jsonc.

1. Configure DATABASE_URL como Secret em Settings → Runtime variables and secrets → Production do Worker.
2. A variável precisa estar disponível na execução, não apenas na seção Builds.
3. Gere e publique a aplicação:

~~~sh
bun run build
bun run deploy
~~~

O deploy por CLI exige autenticação no Cloudflare. Quando houver integração com o GitHub, confira no painel a branch e os comandos de build e publicação.

O build gera dist/client e dist/server. Não versione esses diretórios nem copie credenciais para wrangler.jsonc. A estrutura do banco deve estar provisionada antes do uso; o Worker não cria tabelas durante o login.

Para testar o build no runtime Cloudflare:

~~~sh
bun run preview -- --host 127.0.0.1 --port 4174
bun run test:worker
node scripts/check-worker-session.mjs
~~~

O teste de sessão realiza três chamadas anônimas e três com cookie fictício. As chamadas com cookie consultam o banco configurado sem criar sessões.

Consulte [a documentação de deploy](.next/CLOUDFLARE.md) para detalhes.

## Administração e persistência

Usuários, permissões, livros e histórico são persistidos no Neon em produção. A permissão administrativa não é concedida automaticamente durante o cadastro público.

Os utilitários de banco ficam em .next/scripts. Antes de executar uma operação administrativa, confira o banco de destino e utilize uma conta já cadastrada. Consulte [a documentação do backend](.next/README.md) e [as orientações de transferência para o Neon](.next/NEON.md). As instruções antigas de hospedagem nesse último documento não substituem o procedimento Cloudflare deste README.

Não execute migrações como parte do build ou para corrigir erros de login.

## Validação

~~~sh
bun test tests
bun run typecheck
bun run build
~~~

Testes adicionais do backend Node:

~~~sh
bun run build:node
bun run test:backend
~~~

Verificação de conexão no runtime Workers:

~~~sh
bun run test:worker-db
~~~

Essa verificação usa o banco indicado em .env.local, testa consultas sequenciais e concorrentes e o timeout de uma consulta de leitura. Não altera registros.

## Diagnóstico

| Sintoma | Verificação |
| --- | --- |
| DATABASE_URL_MISSING | Confirme o nome e a presença do segredo nas variáveis de runtime do Worker publicado. |
| DATABASE_OPERATION_FAILED | Consulte os logs do Worker para localizar a etapa de conexão ou consulta que falhou. |
| Login retorna erro genérico | Verifique os logs de autenticação; a mensagem não significa necessariamente senha incorreta. |
| Administração não aparece | Confirme a permissão da conta e entre novamente. |
| Alteração não aparece no site | Confira o commit e o resultado do deploy no Cloudflare. |

Ao compartilhar logs, remova cookies, tokens, senhas, conexões e dados pessoais.
