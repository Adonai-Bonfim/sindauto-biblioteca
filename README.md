# Sindauto Biblioteca

Projeto: Biblioteca Sindauto

Quero desenvolver uma aplicação web responsiva para controle de empréstimos de livros internos do Sindauto Bahia.

A interface deve seguir exatamente o conceito visual do mockup aprovado: moderna, limpa, profissional, mobile first, com identidade visual do Sindauto Bahia.

Objetivo da aplicação

O colaborador escaneia um QR Code e acessa diretamente a Biblioteca Sindauto.

Na página inicial ele deve conseguir:

visualizar os livros disponíveis;

pesquisar livros;

filtrar por categoria;

visualizar livros emprestados;

selecionar um livro;

solicitar empréstimo;

acompanhar os livros que estão com ele;

visualizar data de retirada;

visualizar data prevista de devolução;

renovar empréstimo;

registrar devolução.

A aplicação deve funcionar perfeitamente em celular, tablet e computador.



Identidade visual

Usar a identidade visual do Sindauto Bahia.

Cores principais

Vermelho principal:

#EC2024

Amarelo:

#FEF101

Branco:

#FFFFFF

Cinza de fundo:

#F6F6F6

Cinza de bordas:

#E8E8E8

Texto principal:

#171717

Texto secundário:

#737373

Verde de disponibilidade:

#22C55E

Vermelho de indisponibilidade:

#EF4444

Tipografia

Utilizar:

Montserrat

A interface deve ter aparência moderna, semelhante a aplicações SaaS premium.

Utilizar:

bastante espaço em branco;

cards arredondados;

sombras suaves;

bordas discretas;

ícones minimalistas;

botões grandes e fáceis de clicar;

excelente leitura em dispositivos móveis.



Estrutura geral da aplicação

A aplicação deve possuir duas áreas principais:

COLABORADOR

ADMIN / RH

Neste primeiro desenvolvimento, priorizar a área do colaborador.



Dashboard do colaborador

A página inicial deve seguir esta estrutura visual.

Header

No topo utilizar um header vermelho.

Exibir:

Logo Sindauto Bahia

À direita:

ícone de notificações

O header deve ter aproximadamente:

background: #EC2024;

E texto branco.



Título principal

Logo abaixo do header:

Biblioteca Sindauto

O texto “Biblioteca” deve ser preto.

O texto “Sindauto” deve ser vermelho.

Adicionar um ícone simples de livro aberto ao lado.

Abaixo:

Olá! Escolha seu próximo livro

Texto secundário em cinza.

Adicionar um pequeno detalhe amarelo decorativo abaixo do título.



Cards de resumo

Criar dois cards lado a lado.

Card 1

Ícone:

Livro

Texto:

Disponíveis

Número grande:

24

Ícone e número em vermelho.

Card 2

Ícone:

Usuário

Texto:

Com você

Número:

1

Ícone amarelo e número vermelho.

Os cards devem possuir:

border-radius: 16px;

background: white;

border: 1px solid #EEEEEE;

box-shadow: 0 4px 12px rgba(0,0,0,0.05);



Campo de pesquisa

Criar uma barra de pesquisa grande.

Placeholder:

Pesquisar livro...

Adicionar ícone de lupa.

Visual:

background: #F3F3F3;

border-radius: 50px;

Sem borda pesada.



Filtro por categorias

Logo abaixo da busca criar chips horizontais.

Categorias:

Liderança

Tecnologia

Desenvolvimento

Sustentabilidade

Categoria ativa:

background: #EC2024;

color: white;

Categorias inativas:

background: #F2F2F2;

color: #555555;

Os chips devem ser arredondados.

Em dispositivos móveis permitir scroll horizontal.



Seção: Livros disponíveis

Título:

Livros disponíveis

À direita:

Ver todos >

“Ver todos” deve ser vermelho.

Criar uma grade de livros.

No celular:

2 livros por linha

Em telas maiores:

3 ou 4 livros por linha



Card de livro

Cada card deve apresentar:

Imagem da capa

Título

Autor

Status

Botão

Exemplo:

Hábitos Atômicos



James Clear



● Disponível



[ Ver livro > ]

Status disponível:

color: #16A34A;

background: #DCFCE7;

Botão:

background: #EC2024;

color: white;

border-radius: 10px;



Livros de demonstração

Utilizar inicialmente os seguintes dados mockados.

Livro 1

Título: Hábitos Atômicos

Autor: James Clear

Categoria: Desenvolvimento

Status: Disponível

Livro 2

Título: Essencialismo

Autor: Greg McKeown

Categoria: Desenvolvimento

Status: Disponível

Livro 3

Título: Inteligência Emocional

Autor: Daniel Goleman

Categoria: Desenvolvimento

Status: Emprestado

Disponível novamente: 08/10

Livro 4

Título: Comece pelo Porquê

Autor: Simon Sinek

Categoria: Liderança

Status: Disponível



Estado de livro emprestado

Quando um livro estiver emprestado, substituir o status verde por:

● Emprestado até 08/10

Utilizar:

color: #DC2626;

background: #FEE2E2;

O colaborador não deve visualizar quem está com o livro.

Essa informação deve existir apenas no painel administrativo.



Tela de detalhes do livro

Ao clicar em:

Ver livro

abrir a página de detalhes.

Mostrar:

Capa do livro



Título



Autor



Categoria



Status



Descrição



Prazo de empréstimo

Exemplo:

Prazo de empréstimo: 15 dias

Se o livro estiver disponível, mostrar botão:

Pegar emprestado

Botão vermelho, grande.



Confirmação de empréstimo

Ao clicar em:

Pegar emprestado

abrir modal.

Exibir:

Confirmar empréstimo?

Informações:

Livro:

Hábitos Atômicos



Retirada:

23/09/2026 - 14:32



Prazo:

15 dias



Devolução prevista:

08/10/2026

Botões:

Cancelar

Confirmar empréstimo



Resultado do empréstimo

Após confirmar, mostrar:

Empréstimo realizado com sucesso!

Exibir:

Livro

Data da retirada

Horário

Data prevista de devolução

Adicionar botão:

Ver meus empréstimos



Seção: Meus empréstimos

Na dashboard inicial, abaixo dos livros disponíveis, criar:

Meus empréstimos

Exibir card horizontal.

Exemplo:

Inteligência Emocional



Daniel Goleman



Retirada em:

01/10/2026



Devolução até:

08/10/2026



[ Renovar ]



[ Devolver ]

O botão:

Renovar

deve ser branco com borda cinza.

O botão:

Devolver

deve possuir borda vermelha e texto vermelho.



Menu inferior mobile

Criar menu fixo inferior.

Itens:

Início

Catálogo

Meus livros

Perfil

Cada item deve possuir ícone.

Item ativo:

color: #EC2024;

Adicionar pequena linha vermelha abaixo do item ativo.



Página catálogo

Criar rota:

/catalogo

Mostrar todos os livros.

Adicionar filtros:

Todos

Disponíveis

Emprestados

Liderança

Tecnologia

Desenvolvimento

Sustentabilidade

Adicionar pesquisa.



Página Meus Livros

Criar rota:

/meus-livros

Separar:

Em andamento

Histórico

Para empréstimos ativos mostrar:

Capa

Título

Data retirada

Data devolução

Dias restantes

Status



Perfil do colaborador

Criar rota:

/perfil

Exibir:

Foto/avatar

Nome

E-mail

Setor

Quantidade de empréstimos

Histórico



Sistema de empréstimo

Cada empréstimo precisa armazenar:

ID do empréstimo

ID do usuário

ID do livro

Data da retirada

Horário da retirada

Data prevista de devolução

Data real da devolução

Status

Status possíveis:

ativo

devolvido

atrasado

renovado



Estrutura básica do banco

Criar tabelas semelhantes a:

users

books

loans

categories

users

id

name

email

department

avatar

created_at

books

id

title

author

description

cover_url

category_id

status

quantity

created_at

categories

id

name

loans

id

user_id

book_id

checkout_date

checkout_time

due_date

returned_at

status

renewed

created_at



Regras de negócio

Prazo padrão:

15 dias

Permitir inicialmente:

1 renovação

Ao realizar empréstimo:

book.status = borrowed

Ao realizar devolução:

book.status = available

Nunca apagar histórico de empréstimos.



Dashboard administrativa futura

Preparar a arquitetura para existir uma rota:

/admin

Onde RH poderá visualizar:

Total de livros

Livros disponíveis

Livros emprestados

Livros atrasados

Empréstimos no mês

Colaboradores com livros

Tabela:

Livro

Colaborador

Retirada

Previsão de devolução

Status

Filtros:

Todos

Emprestados

Atrasados

Devolvidos



Responsividade

A interface precisa ser mobile first.

No celular deve ficar visualmente muito próxima de um aplicativo.

No desktop utilizar:

largura máxima de aproximadamente 1200px

centralizada.

Cards devem adaptar automaticamente para mais colunas.



Componentes

Criar componentes reutilizáveis.

Sugestão:

Header

SearchBar

CategoryFilter

BookCard

BookGrid

LoanCard

StatsCard

BottomNavigation

BookDetails

LoanConfirmationModal



Tecnologia

Pode utilizar:

React

TypeScript

Tailwind CSS

Utilizar componentes modernos e organizados.

Se necessário utilizar:

Lucide Icons

para os ícones.



Direção visual obrigatória

A interface precisa parecer:

moderna

profissional

corporativa

simples

intuitiva

premium

Não criar aparência de sistema antigo ou painel administrativo genérico.

Quero que a dashboard principal fique visualmente o mais próxima possível do mockup de referência da Biblioteca Sindauto:

header vermelho;

cards brancos;

cantos arredondados;

vermelho e amarelo como cores de destaque;

capas dos livros;

seção de livros disponíveis;

seção de empréstimos;

navegação inferior;

visual de aplicativo mobile;

bastante espaço em branco;

design limpo;

experiência simples para o colaborador.

Priorize fidelidade visual ao mockup fornecido.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bbe1760b-25ff-47bc-9886-c6dfecb55def).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
