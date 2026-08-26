# `src/lib/auth` — Sessão e autenticação

## Propósito

Esta pasta concentra o fluxo de autenticação do app. Google OAuth via Auth.js/NextAuth aplica a regra de acesso corporativo por domínio, e-mail registrado em variáveis de ambiente e cadastro ativo no Supabase quando ele está configurado. O fluxo de aquisição por campanha também pode autorizar Google por intent curto e sempre força role `cliente`. O Auth.js usa Supabase Adapter, JWT session, lê membership em `organization_members` e assina um JWT para RLS. O login manual de superadmin usa Credentials + Supabase quando habilitado; o login mockado por senha fica disponível apenas como fallback de desenvolvimento.

## Convenções

- Não importar helpers server-only em Client Components. Componentes client devem usar Auth.js client (`next-auth/react`) ou falar com `/api/auth/*` para o fallback mockado.
- `access-control.ts` é a fonte da regra de domínio/e-mail. Não duplique essa validação em componentes.
- Usuários Google corporativos só entram com `email_verified=true`, domínio em `AUTH_ALLOWED_DOMAINS`, e-mail em `AUTH_ALLOWED_EMAILS` e, quando Supabase estiver configurado, acesso ativo real; linha órfã em `next_auth.users` não libera login.
- Usuários Google vindos de `/a/[slug]` entram com intent de campanha ativo, sessão marcada como `acquisition`, completam empresa em `/a/[slug]/completar` e permanecem como `cliente`.
- OAuth de campanha deve começar sem cookie de sessão Auth.js ativo. Se um superadmin ou usuário corporativo estiver logado, limpe a sessão antes do redirect ao Google para evitar vínculo da conta escolhida ao usuário anterior.
- `AUTH_ADMIN_EMAILS` e `AUTH_SUPERADMIN_EMAILS` definem role após o e-mail já ter sido permitido.
- `AUTH_ENABLE_SUPERADMIN_PASSWORD_LOGIN=true` habilita e-mail/senha real para superadmin quando Supabase estiver configurado. A senha vem de `AUTH_SUPERADMIN_PASSWORD`, é gravada apenas como hash em `app_private.user_password_credentials` e não deve ser versionada.
- `AUTH_ORG_BY_DOMAIN` pode mapear domínio para nome da empresa exibido na sessão.
- O callback `signIn` do Auth.js deve apenas autorizar ou negar o perfil Google. Membership de campanha é criado somente nos handlers de aquisição após captura dos dados.
- `AUTH_SECRET` ou `NEXTAUTH_SECRET` deve existir em produção. Em desenvolvimento local, `auth.ts` usa um segredo fixo apenas para evitar `MissingSecret` enquanto o login mockado ou a tela pública são testados sem OAuth completo.
- `SUPABASE_JWT_SECRET` assina `session.supabaseAccessToken` para policies RLS. Não use claims editáveis de usuário para autorização.
- O cookie mockado `directscal_session` guarda apenas um identificador mínimo e sustenta o fallback demo por e-mail/senha fora de produção.
- `directscal_session` só pode ser aceito quando `AUTH_ENABLE_DEV_PASSWORD_LOGIN=true`; não use esse cookie como fallback silencioso para sessão real.
- Senhas mockadas existem apenas para o acesso de demonstração e não representam segurança real.
- Usuários com role `superadmin` devem ir para `/admin/modulos` após autenticação.
- `superadmin` é uma identidade exclusivamente administrativa: não recebe `supabaseAccessToken` de cliente, não acessa organizações/diagnósticos pela camada Maturidade e deve permanecer em `/admin/*` + `/api/admin/*`.
- `supabase-auth.ts` é a ponte entre Auth.js e membership real no Supabase; preserve essa fronteira ao ajustar roles.
