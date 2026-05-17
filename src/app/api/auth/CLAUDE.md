# `src/app/api/auth` — Route Handlers de autenticação

## Propósito

Endpoints HTTP usados pelas telas públicas de autenticação. A rota dinâmica `[...nextauth]` pertence ao Auth.js/NextAuth e executa o OAuth do Google, Credentials de superadmin e Credentials de aquisição com Supabase Adapter quando configurado. As rotas `login`, `register` e `logout` existem para o fallback mockado de desenvolvimento.

## Convenções

- Use Route Handlers para mutações de sessão.
- Google OAuth deve validar domínio/e-mail em `src/lib/auth/access-control.ts`, não dentro do Route Handler.
- Credentials com `flow: "app"` são exclusivos para superadmin em `src/lib/auth/supabase-auth.ts`; Credentials com `flow: "acquisition"` continuam no fluxo de campanha.
- `login` deve aceitar os usuários mockados apenas quando `AUTH_ENABLE_DEV_PASSWORD_LOGIN=true` e fora de produção. `register` segue a mesma restrição.
- Respostas de erro devem ser curtas e em pt-BR.
- O cookie precisa permanecer `httpOnly`, `sameSite: "lax"`, `path: "/"` e `secure` em produção.
