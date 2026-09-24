# Cadastro e login por telefone

**Estado atual: Supabase desativado no fluxo do protótipo.** Cadastro, login e
saída usam `src/lib/prototype-auth.ts` e armazenamento local do navegador.
As contas não são compartilhadas entre dispositivos ou endereços diferentes.
As instruções abaixo ficam reservadas para a futura integração real.

A interface usa Supabase Auth com telefone brasileiro normalizado (+55), senha
e metadados de nome, sobrenome e setor. Não armazena senhas no perfil.

Para ativar no projeto conectado:

1. Aplicar a migration `20260924140000_phone_profiles.sql` pelo fluxo de migrations
   do projeto ou SQL Editor do Supabase. Ela permite perfis sem e-mail e cria o
   perfil automaticamente na criação da conta.
2. Em Authentication / Sign In / Providers, habilitar Phone e o cadastro de usuários.
3. Desativar a exigência de confirmação de telefone para o fluxo solicitado sem SMS.
   Nesse modo, o telefone é um identificador informado pelo usuário, não verificado.
4. Testar cadastro, saída e entrada com uma conta de teste autorizada. Conferir o
   perfil no banco e o isolamento entre usuários pelas políticas RLS existentes.

Documentação: https://supabase.com/docs/guides/auth/passwords

A configuração local abaixo não altera automaticamente o projeto remoto.
O QR code pode apontar à página inicial ou a um livro; o formulário preserva a URL.
Para uso fora da rede local, o QR code deve usar a URL publicada com HTTPS.

Os empréstimos do protótipo são compartilhados pela memória do servidor local.
Todos os dispositivos conectados a ele consultam a disponibilidade a cada dois
segundos. Retirada e renovação usam períodos de 15 dias; somente a devolução libera
o exemplar. Reiniciar o servidor apaga os empréstimos simulados. A identificação
das contas é local e não constitui autenticação de produção.
