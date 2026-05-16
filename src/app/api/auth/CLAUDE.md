# `src/app/api/auth` — Route Handlers de autenticação

## Propósito

Endpoints HTTP usados pelas telas públicas de autenticação. A rota dinâmica `[...nextauth]` pertence ao Auth.js/NextAuth e executa o OAuth do Google. As rotas `login`, `register` e `logout` existem para o fallback mockado.

## Convenções

- Use Route Handlers para mutações de sessão.
- Não acessar banco ou Supabase nesta etapa.
- Google OAuth deve validar domínio/e-mail em `src/lib/auth/access-control.ts`, não dentro do Route Handler.
- `login` deve aceitar os usuários mockados para demonstração. `register` continua restrito por `AUTH_ENABLE_DEV_PASSWORD_LOGIN`.
- Respostas de erro devem ser curtas e em pt-BR.
- O cookie precisa permanecer `httpOnly`, `sameSite: "lax"`, `path: "/"` e `secure` em produção.
