# `src/app/api/auth` — Route Handlers de autenticação

## Propósito

Endpoints HTTP usados pelas telas públicas de autenticação. A rota dinâmica `[...nextauth]` pertence ao Auth.js/NextAuth e executa o OAuth do Google, Credentials de clientes/admins, superadmin e aquisição com Supabase Adapter quando configurado. As rotas `login`, `register` e `logout` existem para o fallback mockado de desenvolvimento.

## Convenções

- Use Route Handlers para mutações de sessão.
- Google OAuth deve validar domínio/e-mail em `src/lib/auth/access-control.ts`, não dentro do Route Handler.
- Credentials com `flow: "app"` atendem a tela `/entrar`: resolvem superadmin primeiro em `src/lib/auth/supabase-auth.ts` e depois clientes/admins com senha cadastrada e membership, independentemente de lead de aquisição. Clientes/admins não contornam a flag de superadmin. O JWT de senha usa o papel real do membership sem marcar aquisição para contas já provisionadas. Credentials com `flow: "acquisition"` continuam no fluxo de campanha após cadastro.
- `login` deve aceitar os usuários mockados apenas quando `AUTH_ENABLE_DEV_PASSWORD_LOGIN=true` e fora de produção. `register` segue a mesma restrição.
- Respostas de erro devem ser curtas e em pt-BR.
- O cookie precisa permanecer `httpOnly`, `sameSite: "lax"`, `path: "/"` e `secure` em produção.
- O fluxo `leadership-invitations` usa sessão Auth.js temporária marcada, compara o e-mail verificado do Google no callback e remove a sessão após o aceite.


A14: reset-password é recuperação real e genérica para não revelar existência/método da conta; confirma persistência da solicitação antes de responder, falha de configuração/banco retorna indisponibilidade. complete valida token/versão/expiração e troca senha atomicamente; sem login automático. Nunca usar endpoint mockado para provar recuperação real.


`site-profile` é a leitura mínima autenticada para o site público: nome/foto, sem tokens, apenas Origins HTTPS oficiais, sem cache. Usa a sessão existente e não altera o login. Ver `site-profile/CLAUDE.md`.
