# Directscal OMDx

Aplicação Next.js para o **OMDx — Diagnóstico de Maturidade Operacional** da Directscal.

Nesta fase, o produto mantém a interface OMDx com dados mockados, mas já possui a fundação de produção para Supabase: migrations versionadas, Auth.js com Supabase Adapter, JWT para RLS, route handlers de mutação e testes iniciais. A autenticação principal usa Google OAuth com allowlist corporativa por variável de ambiente.

## Stack

- Next.js `16.2.6` com App Router e Turbopack.
- React `19.2.4`.
- TypeScript strict.
- Tailwind CSS `4`.
- shadcn/ui `base-nova` sobre `base-ui`.
- next-themes para tema claro/escuro.
- Auth.js/NextAuth para Google OAuth.
- Supabase como backend de produção planejado e versionado em `supabase/`.
- lucide-react para ícones.
- zod para contratos e validação de dados.

## Fluxo OMDx

- `/omdx` é o dashboard executivo do módulo.
- `/omdx/diagnosticos` é a área operacional para lista, filtros, criação e configuração, acessada pela sidebar.
- Criação/configuração de diagnóstico acontece em drawer lateral dentro de `/omdx/diagnosticos`.
- `/omdx/[id]/compartilhar` é uma camada de compartilhamento com links por grupo.
- O respondente público será atendido futuramente por `/r/[token]`.

Regra de navegação:

- O dashboard raiz `/omdx` não usa breadcrumb.
- Camadas abaixo usam breadcrumb, como `OMDx / Diagnósticos` e `OMDx / Diagnósticos / Compartilhar`.
- `Diagnósticos` é navegação lateral, não CTA dentro do dashboard.

## Dados

Os dados da UI ainda passam por `src/lib/data/omdx-data-source.ts` e usam `src/lib/mock-data.ts` como seed temporário. A fundação de produção vive em `supabase/` e nos route handlers `src/app/api/omdx/`, pronta para a próxima fatia trocar telas e componentes para leituras reais.

Hoje existem mocks para:

- Dimensões do OMDx.
- Diagnósticos em rascunho, ativos e encerrados.
- Template padrão `OMDx padrão`.
- Escala Likert de 1 a 5.
- KPIs agregados do dashboard.

Convenção atual:

- Páginas e componentes não devem importar arrays de `mock-data.ts` diretamente.
- A preparação é Supabase-friendly, com contratos `Db*` em `snake_case`, domínio/UI em `camelCase` e mappers centralizados.
- Há clients Supabase server-side em `src/lib/supabase/`, migrations em `supabase/migrations/` e route handlers iniciais de escrita real.

## Autenticação

Configure as variáveis abaixo para habilitar Google OAuth:

```bash
AUTH_SECRET=
AUTH_URL=https://app.directscal.com
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_ALLOWED_DOMAINS=empresa.com.br,directscal.com.br
AUTH_ALLOWED_EMAILS=cliente@empresa.com.br,admin@directscal.com.br
AUTH_ORG_BY_DOMAIN={"empresa.com.br":"Nome da Empresa","directscal.com.br":"Directscal"}
AUTH_ADMIN_EMAILS=gestor@empresa.com.br
AUTH_SUPERADMIN_EMAILS=admin@directscal.com.br
AUTH_ENABLE_SUPERADMIN_PASSWORD_LOGIN=false
AUTH_SUPERADMIN_PASSWORD=
AUTH_ENABLE_DEV_PASSWORD_LOGIN=false # habilita cadastro mockado em /criar-conta
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
PUBLIC_APP_URL=https://app.directscal.com
FEATURE_ACQUISITION=false
```

`AUTH_SECRET` continua obrigatório em produção. Em desenvolvimento local, o app usa um segredo fixo de fallback para evitar erro `MissingSecret` quando a tela de login ou o fallback mockado são testados sem configurar OAuth completo.

Para login manual de superadmin, habilite `AUTH_ENABLE_SUPERADMIN_PASSWORD_LOGIN=true`, configure `AUTH_SUPERADMIN_EMAILS` com o e-mail autorizado e guarde a senha real em `AUTH_SUPERADMIN_PASSWORD`. Essa senha é usada no servidor para provisionar/atualizar o hash em `app_private.user_password_credentials`; não versione esse valor.

O callback do Google deve apontar para `/api/auth/callback/google`, por exemplo `http://localhost:3000/api/auth/callback/google` em desenvolvimento.

## Comandos

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
npx tsc --noEmit
```

## Documentação para agentes

Leia `AGENTS.md` antes de editar código. Cada pasta com responsabilidade própria tem um `CLAUDE.md` com regras locais.
