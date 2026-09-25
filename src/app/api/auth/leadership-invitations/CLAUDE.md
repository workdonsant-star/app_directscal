# `/api/auth/leadership-invitations` — Confirmação Google

## Propósito

Inicia e conclui a autenticação temporária de uma liderança convidada. O fluxo valida o token no servidor, exige a conta Google do e-mail exato, ativa a pessoa e cria o acesso `cliente` ou `admin` na empresa.

## Convenções

- O token bruto existe apenas na URL pública e no cookie `httpOnly` curto; o banco recebe somente SHA-256.
- Ao iniciar, limpe sessões Auth.js anteriores para impedir vínculo acidental de contas. No sucesso, preserve a nova sessão Google e limpe apenas os intents; em erro, limpe também a sessão.
- O aceite final acontece pela RPC transacional `app_private.accept_leadership_invitation`.
- A sessão marcada como `leadershipInvitation` serve somente para concluir o convite; após o membership existir, o callback JWT a converte em sessão regular e redireciona para `/omdx`.
