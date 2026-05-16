# Directscal OMDx

Aplicação Next.js para o **OMDx — Diagnóstico de Maturidade Operacional** da Directscal.

Nesta fase, o produto valida interface e fluxos com dados mockados. Não há backend, banco ou testes E2E. A autenticação principal usa Google OAuth com Auth.js/NextAuth e allowlist corporativa por variável de ambiente.

## Stack

- Next.js `16.2.6` com App Router e Turbopack.
- React `19.2.4`.
- TypeScript strict.
- Tailwind CSS `4`.
- shadcn/ui `base-nova` sobre `base-ui`.
- next-themes para tema claro/escuro.
- Auth.js/NextAuth para Google OAuth.
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

Os dados da UI passam por `src/lib/data/omdx-data-source.ts`. Os contratos vivem em `src/lib/contracts/` com Zod, e `src/lib/types.ts` reexporta os tipos públicos. `src/lib/mock-data.ts` permanece como seed temporário dos dados fictícios.

Hoje existem mocks para:

- Dimensões do OMDx.
- Diagnósticos em rascunho, ativos e encerrados.
- Template padrão `OMDx padrão`.
- Escala Likert de 1 a 5.
- KPIs agregados do dashboard.

Convenção atual:

- Páginas e componentes não devem importar arrays de `mock-data.ts` diretamente.
- A preparação é Supabase-friendly, com contratos `Db*` em `snake_case`, domínio/UI em `camelCase` e mappers centralizados.
- Ainda não há Supabase client, migrations ou API de dados real.

## Autenticação

Configure as variáveis abaixo para habilitar Google OAuth:

```bash
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_ALLOWED_DOMAINS=empresa.com.br,directscal.com.br
AUTH_ALLOWED_EMAILS=cliente@empresa.com.br,admin@directscal.com.br
AUTH_ORG_BY_DOMAIN={"empresa.com.br":"Nome da Empresa","directscal.com.br":"Directscal"}
AUTH_ADMIN_EMAILS=gestor@empresa.com.br
AUTH_SUPERADMIN_EMAILS=admin@directscal.com.br
AUTH_ENABLE_DEV_PASSWORD_LOGIN=false # habilita cadastro mockado em /criar-conta
```

O callback do Google deve apontar para `/api/auth/callback/google`, por exemplo `http://localhost:3000/api/auth/callback/google` em desenvolvimento.

## Comandos

```bash
npm run dev
npm run build
npm run lint
npx tsc --noEmit
```

## Documentação para agentes

Leia `AGENTS.md` antes de editar código. Cada pasta com responsabilidade própria tem um `CLAUDE.md` com regras locais.
