# `/a/[token]` — Link de aquisição

## Propósito

Página pública que inicia o cadastro de cliente final a partir de uma campanha de aquisição.

## Convenções locais

- Token inválido mostra estado simples de erro.
- Campanha pausada mostra estado simples, sem formulário.
- O formulário reflete campos editados pelo superadmin e persistidos no Supabase.
- A primeira tela mostra apenas os métodos de acesso. Google cria intent, limpa sessão Auth.js anterior e redireciona para completar dados da empresa; a etapa de e-mail concentra os dados da campanha e senha.
- Usuários criados por esta rota sempre entram como `cliente` e são enviados para `/omdx`.
