# `src/lib/auth` — Sessão e autenticação

## Propósito

Esta pasta concentra o fluxo de autenticação do app. Google OAuth via Auth.js/NextAuth aplica a regra de acesso corporativo por domínio, e-mail registrado em variáveis de ambiente e cadastro ativo no Supabase quando ele está configurado. O fluxo de aquisição por campanha também pode autorizar Google por intent curto e sempre força role `cliente`. O Auth.js usa Supabase Adapter, JWT session, lê membership em `organization_members` e assina um JWT para RLS. O login por e-mail/senha de clientes e admins usa Credentials + Supabase, hash scrypt existente e membership real, sem depender de campanha ou flag de superadmin. Contas Google sem senha cadastrada continuam pelo Google. O login manual de superadmin usa Credentials + Supabase quando habilitado; o login mockado por senha fica disponível apenas como fallback de desenvolvimento.

## Convenções

- Não importar helpers server-only em Client Components. Componentes client devem usar Auth.js client (`next-auth/react`) ou falar com `/api/auth/*` para o fallback mockado.
- `access-control.ts` é a fonte da regra de domínio/e-mail. Não duplique essa validação em componentes.
- Usuários Google corporativos só entram com `email_verified=true`, domínio em `AUTH_ALLOWED_DOMAINS`, e-mail em `AUTH_ALLOWED_EMAILS` e, quando Supabase estiver configurado, acesso ativo real; linha órfã em `next_auth.users` não libera login.
- Usuários Google vindos de `/a/[slug]` entram com intent de campanha ativo, sessão marcada como `acquisition`, completam empresa em `/a/[slug]/completar` e permanecem como `cliente`.
- Lideranças vindas de `/convites/lideranca/[token]` entram com intent curto, e-mail Google exatamente igual ao convite e sessão marcada como `leadershipInvitation`. O aceite cria o membership `cliente` ou `admin`; na navegação seguinte, o JWT troca a sessão temporária pela sessão regular sem exigir um segundo login.
- OAuth de campanha deve começar sem cookie de sessão Auth.js ativo. Se um superadmin ou usuário corporativo estiver logado, limpe a sessão antes do redirect ao Google para evitar vínculo da conta escolhida ao usuário anterior.
- `AUTH_ADMIN_EMAILS` e `AUTH_SUPERADMIN_EMAILS` definem role após o e-mail já ter sido permitido.
- `AUTH_ENABLE_SUPERADMIN_PASSWORD_LOGIN=true` habilita e-mail/senha real para superadmin quando Supabase estiver configurado. A senha vem de `AUTH_SUPERADMIN_PASSWORD`, é gravada apenas como hash em `app_private.user_password_credentials` e não deve ser versionada.
- `AUTH_ORG_BY_DOMAIN` pode mapear domínio para nome da empresa exibido na sessão.
- O callback `signIn` do Auth.js deve apenas autorizar ou negar o perfil Google. Membership de campanha é criado somente nos handlers de aquisição após captura dos dados.
- O aceite de liderança é concluído pela rota `/api/auth/leadership-invitations/complete` e pela RPC transacional; o callback OAuth não grava a estrutura diretamente.
- `AUTH_SECRET` ou `NEXTAUTH_SECRET` deve existir em produção. Em desenvolvimento local, `auth.ts` usa um segredo fixo apenas para evitar `MissingSecret` enquanto o login mockado ou a tela pública são testados sem OAuth completo.
- `SUPABASE_JWT_SECRET` assina `session.supabaseAccessToken` para policies RLS. Não use claims editáveis de usuário para autorização.
- O cookie mockado `directscal_session` guarda apenas um identificador mínimo e sustenta o fallback demo por e-mail/senha fora de produção.
- `directscal_session` só pode ser aceito quando `AUTH_ENABLE_DEV_PASSWORD_LOGIN=true`; não use esse cookie como fallback silencioso para sessão real.
- Senhas mockadas existem apenas para o acesso de demonstração e não representam segurança real.
- Usuários com role `superadmin` devem ir para `/admin/operacao` após autenticação.
- `superadmin` é uma identidade exclusivamente administrativa: não recebe `supabaseAccessToken` de cliente, não acessa organizações/diagnósticos pela camada Maturidade e deve permanecer em `/admin/*` + `/api/admin/*`.
- Para diagnósticos, `cliente` vê e gerencia todos os registros da empresa; `admin` vê os que criou e aqueles em que foi atribuído como liderança. O criador pode gerenciar, mas somente `cliente` vê o link de Fundador.
- A decisão pura de acesso fica em `diagnostic-access.ts`; verificações server-side que consultam o banco ficam em `authorization.ts`.
- Na superfície cliente, `cliente` é apresentado como Superadmin da empresa e pode administrar Configurações/Contratos; `admin` acessa as demais funcionalidades. Não confundir nenhum deles com o `superadmin` global.
- `supabase-auth.ts` é a ponte entre Auth.js e membership real no Supabase; preserve essa fronteira ao ajustar roles.

- getCurrentAuthSession hidrata nome e avatar a partir do banco em cada request. account_profiles prevalece sobre o JWT e sobre futuras atualizações Google. Autorização permanece na sessão, nunca no perfil editável.

Sessões temporárias de aquisição e convite são promovidas pelo callback JWT para sessão regular assim que existe membership no banco. A promoção limpa ambos os flags antes de acessar o onboarding, evitando o ciclo `/omdx` → `/onboarding` → `/entrar` → `/omdx`; sessões ainda sem membership mantêm o intent temporário.


A14: password-recovery/crypto implementam recuperação real somente de cliente/admin com credencial existente. Token aleatório de 256 bits, hash no banco e envelope AES-GCM na outbox; 1h, uso único, invalidado por nova solicitação/versão. Google-only e superadmin não recebem recuperação pública. JWT revalida membership e versão a cada request; JWT RLS dura até cinco minutos e inclui session_version. Enforcement direto do banco está desativado até deploy compatível. Ver docs/acesso-e-recuperacao-de-conta.md.


Provisionamento corporativo preserva um membership superadmin já existente e retorna sua identidade real antes de criar/atualizar organização por domínio. Assim o login não recria empresas apagadas após transferência do acesso global ao registro interno. A conta e o papel continuam sendo validados no banco; e-mail sozinho não restaura membership removido.
