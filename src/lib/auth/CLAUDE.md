# `src/lib/auth` — Sessão e autenticação

## Propósito

Esta pasta concentra o fluxo de autenticação do app. Google OAuth via Auth.js/NextAuth aplica a regra de acesso corporativo por domínio e e-mail registrado em variáveis de ambiente. Quando Supabase está configurado, o Auth.js usa Supabase Adapter, provisiona membership em `organization_members` e assina um JWT para RLS. O login mockado por senha fica disponível apenas como fallback de desenvolvimento.

## Convenções

- Não importar helpers server-only em Client Components. Componentes client devem usar Auth.js client (`next-auth/react`) ou falar com `/api/auth/*` para o fallback mockado.
- `access-control.ts` é a fonte da regra de domínio/e-mail. Não duplique essa validação em componentes.
- Usuários Google só entram com `email_verified=true`, domínio em `AUTH_ALLOWED_DOMAINS` e e-mail em `AUTH_ALLOWED_EMAILS`.
- `AUTH_ADMIN_EMAILS` e `AUTH_SUPERADMIN_EMAILS` definem role após o e-mail já ter sido permitido.
- `AUTH_ORG_BY_DOMAIN` pode mapear domínio para nome da empresa exibido na sessão.
- `AUTH_SECRET` ou `NEXTAUTH_SECRET` deve existir em produção. Em desenvolvimento local, `auth.ts` usa um segredo fixo apenas para evitar `MissingSecret` enquanto o login mockado ou a tela pública são testados sem OAuth completo.
- `SUPABASE_JWT_SECRET` assina `session.supabaseAccessToken` para policies RLS. Não use claims editáveis de usuário para autorização.
- O cookie mockado `directscal_session` guarda apenas um identificador mínimo e sustenta o fallback demo por e-mail/senha fora de produção.
- Senhas mockadas existem apenas para o acesso de demonstração e não representam segurança real.
- Usuários com role `superadmin` devem ir para `/admin/modulos` após autenticação.
- `supabase-auth.ts` é a ponte entre Auth.js e membership real no Supabase; preserve essa fronteira ao ajustar roles.
