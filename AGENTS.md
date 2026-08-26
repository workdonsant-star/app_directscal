# AGENTS.md — Guia Para Agentes de IA

Este arquivo é a orientação principal para agentes que trabalham neste repositório, especialmente Claude Code, GPT-5/Codex e similares. **Leia antes de editar código, documentação, testes ou configuração.**

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Documentação por pasta — leitura obrigatória

> **Regra fundamental deste repositório:** cada pasta com responsabilidade própria tem o seu próprio `CLAUDE.md`. Antes de editar qualquer arquivo, o agente deve abrir o `CLAUDE.md` da pasta mais próxima e ler até o fim. Se a pasta ainda não tiver um, **crie-o** ao introduzir a mudança, descrevendo o propósito, as decisões e as convenções locais.

Estrutura esperada:

```
.
├── AGENTS.md                          ← este arquivo (regras globais)
├── CLAUDE.md                          ← alias que aponta para AGENTS.md
└── src/
    ├── app/CLAUDE.md                  ← rotas, layouts, route groups, App Router
    ├── components/CLAUDE.md           ← padrões visuais por domínio
    │   ├── ui/CLAUDE.md               ← primitives shadcn/ui (base-ui)
    │   └── omdx/CLAUDE.md             ← componentes do módulo Maturidade
    └── lib/CLAUDE.md                  ← contratos, data-source, mocks e utils
```

Ao criar uma pasta nova com responsabilidade clara (novo módulo, novo domínio, nova feature substancial), **gere um `CLAUDE.md` na raiz dela**. Se uma pasta perder relevância, atualize ou remova o doc local.

## Contexto do produto

**Directscal** é uma empresa de serviços e tecnologia focada em estruturação de negócios digitais que precisam crescer. A marca opera na tensão deliberada **metodologia tradicional, execução moderna** — rigor de consultoria com a densidade de produto Vercel/shadcn.

Este repositório implementa o módulo **Maturidade**. Ele avalia empresas em seis dimensões (Cultura, Visão, Comunicação, Processos, Liderança, Performance) a partir da percepção de três grupos: Fundador, Liderança e Operação.

Princípios do produto:
- **Linguagem consultiva, não corporativa.** Frases diretas, números fazem o trabalho, sem hype.
- **Português do Brasil** como superfície primária; inglês apenas em termos técnicos consagrados (cohort, churn, runway).
- **Sentence case** em UI; sem ponto de exclamação; sem emoji em interface visível ao usuário.
- **Densidade premium**: tipografia e estrutura fazem o trabalho — não cor nem ornamento.

## Stack atual

- **Next.js `16.2.6`** com **App Router** e **Turbopack**.
- **React `19.2.4`**.
- **TypeScript** em modo `strict`.
- **Tailwind CSS `4`** com tokens em `src/app/globals.css`.
- **shadcn/ui** estilo `base-nova` (sobre **base-ui**, não Radix). API usa `render` no lugar de `asChild`.
- **next-themes** para dark mode (default `system`, com alternância manual no dropdown do usuário).
- **Auth.js/NextAuth `5 beta`** para Google OAuth.
- **lucide-react** para ícones.
- Fontes Google: **Inter** (sans), **Instrument Serif** (display itálico), **JetBrains Mono** (mono — substitui IBM Plex Mono do design system original).

Estado atual: **scaffold inicial + dashboard Maturidade + Google OAuth com allowlist corporativa, fallback mockado de autenticação para desenvolvimento, diagnóstico, compartilhamento, relatórios PDF, insights, documentação, perfil, superadmin e aquisição por campanha em Supabase**. O core de Maturidade e o fluxo de aquisição já usam Supabase via camada server-side; algumas superfícies como perfil ainda preservam mocks locais. O cookie mockado fica restrito ao fallback de desenvolvimento.

## Fontes de verdade

| Área | Onde olhar |
| --- | --- |
| Regras globais para agentes | `AGENTS.md` (este arquivo) |
| Design system da marca | `Directscal Design System/README.md` e `Directscal Design System/colors_and_type.css` |
| Tokens portados para o app | `src/app/globals.css` |
| Rotas, layouts, App Router | `src/app/CLAUDE.md` |
| Padrões de componentes | `src/components/CLAUDE.md` |
| Primitives shadcn/ui | `src/components/ui/CLAUDE.md` |
| Componentes do módulo Maturidade | `src/components/omdx/CLAUDE.md` |
| Contratos, data-source, mocks e utils | `src/lib/CLAUDE.md` |

A pasta `Directscal Design System/` é **fonte canônica de marca** (cores, tipografia, voz, componentes de referência). Não edite arquivos lá dentro sem motivo claro — eles foram gerados a partir do logo e da definição de marca da empresa.

## Regras de trabalho

- **Preserve mudanças do usuário.** O repositório pode estar sujo; nunca reverta arquivos que você não alterou.
- **Mudanças pequenas, coesas e verificáveis.** Sem refactor oportunista no meio de bug fix.
- **Não adicione dependências sem necessidade clara.** Se adicionar, justifique no commit ou no `CLAUDE.md` local.
- **Não copie padrões antigos sem validar.** Esta é uma stack nova (Next 16, React 19, Tailwind 4, shadcn base-ui) — boa parte da memória de treinamento é obsoleta.
- **Não exponha segredos**, tokens, dados pessoais reais ou valores de produção.
- **Se alterar comportamento, ajuste a documentação local** (`CLAUDE.md` da pasta) na mesma mudança.
- **Registre mudanças estruturais no Notion.** Toda mudança que altere como o app funciona, introduza nova funcionalidade, crie novo fluxo, mude arquitetura, dados, permissões ou integração deve ser registrada e documentada no Notion na mesma entrega. Se o agente não tiver acesso ao Notion, deixe a pendência explícita no fechamento da tarefa com o resumo pronto para copiar.
- **Antes de "consertar" algo, entenda a causa raiz.** Não mascare sintomas.
- **Foco em interface e fluxos primeiro.** Não introduza motor de API, banco ou autenticação real até o usuário pedir explicitamente.

## Next.js 16

Antes de escrever ou alterar código de Next.js:
- Consulte a documentação local em `node_modules/next/dist/docs/` quando houver dúvida sobre API.
- Não assuma APIs antigas (Pages Router, `getServerSideProps`, `_app`, etc.).
- **Server Components por padrão.** Use `"use client"` apenas quando houver estado, efeitos, browser APIs ou interatividade real.
- Use `redirect()` de `next/navigation` para redirects no servidor (existe em `src/app/page.tsx`).
- Route groups com `(nome)` não criam segmento de URL — usados aqui em `src/app/(auth)/` para telas públicas de autenticação e `src/app/(app)/` para o layout autenticado.

## shadcn/ui sobre base-ui

A versão deste projeto usa **base-ui**, não Radix. Diferenças importantes:

- **Não existe `asChild`.** Use a prop `render` para compor com outros componentes:
  ```tsx
  // ERRADO
  <DropdownMenuTrigger asChild><Button>Abrir</Button></DropdownMenuTrigger>

  // CERTO
  <DropdownMenuTrigger render={<Button />}>Abrir</DropdownMenuTrigger>
  ```
- `TooltipProvider` recebe `delay`, não `delayDuration`.
- `SidebarMenuButton` aceita `render={<Link href="..." />}` para virar um link.

Sempre confira o tipo do componente em `src/components/ui/` antes de presumir API.

## Arquitetura do projeto

```
src/
├── app/
│   ├── (auth)/              ← telas públicas de autenticação
│   ├── (app)/                ← route group autenticado (sidebar + topbar)
│   │   ├── layout.tsx        ← valida sessão + SidebarProvider + AppSidebar + SidebarInset
│   │   ├── admin/            ← visão de superadmin
│   │   └── omdx/
│   │       ├── page.tsx      ← dashboard executivo de Maturidade
│   │       ├── diagnosticos/ ← área operacional de diagnósticos
│   │       └── [id]/         ← camadas de detalhe/compartilhamento
│   ├── a/[slug]/             ← aquisição pública por campanha
│   ├── api/auth/             ← Auth.js Google OAuth + endpoints mockados de fallback
│   ├── globals.css           ← tokens da Directscal mapeados p/ shadcn
│   ├── layout.tsx            ← root layout, ThemeProvider, fontes
│   └── page.tsx              ← redirect("/omdx")
├── components/
│   ├── ui/                   ← primitives shadcn (button, card, sidebar, …)
│   ├── admin/                ← componentes do superadmin e aquisição
│   ├── auth/                 ← componentes do fluxo de autenticação
│   ├── omdx/                 ← componentes do módulo Maturidade
│   ├── app-sidebar.tsx       ← sidebar global do app autenticado
│   ├── app-topbar.tsx        ← topbar com breadcrumb + ações
│   ├── kpi-card.tsx          ← card compartilhado de KPI
│   ├── theme-provider.tsx    ← wrapper de next-themes
│   └── theme-toggle.tsx      ← botão sol/lua
└── lib/
    ├── auth/                 ← Google OAuth, sessão e fallback mockado
    ├── contracts/            ← schemas Zod, tipos e mappers Supabase-friendly
    ├── data/                 ← data-sources server-side, helpers puros e regras de produção
    ├── supabase/             ← clients server-side Supabase
    ├── mock-data.ts          ← seed temporário dos dados fictícios
    ├── types.ts              ← reexports dos tipos públicos
    └── utils.ts              ← cn() (clsx + tailwind-merge)
```

Rotas atuais:
- `/` → redireciona para `/omdx`.
- `/entrar` → tela pública de login com Google OAuth e fallback mockado opcional.
- `/criar-conta` → cadastro mockado com criação de sessão, apenas quando `AUTH_ENABLE_DEV_PASSWORD_LOGIN=true`.
- `/recuperar-senha` → recuperação mockada de senha.
- `/omdx` → dashboard executivo de Maturidade.
- `/omdx/[id]/compartilhar` → compartilhamento mockado por grupo.
- `/omdx/[id]/relatorio` → download autenticado do PDF consolidado.
- `/ativos-de-gestao` → rota legada inativa; redireciona para `/omdx`.
- `/ativos-de-gestao/sops` → rota legada inativa; redireciona para `/omdx`.
- `/sops` → redirect legado para `/omdx`.
- `/admin` → redireciona para `/admin/modulos`.
- `/admin/modulos` → superadmin para módulos disponíveis.
- `/admin/campanhas` → campanhas, links e campos de aquisição.
- `/admin/leads` → leads capturados por links de aquisição.
- `/admin/empresas` → empresas derivadas dos leads.
- Contas `superadmin` ficam restritas a `/admin/*` e `/api/admin/*`; não acessam páginas, downloads, APIs ou dados RLS da aplicação do cliente.
- `/a/[slug]` → início público de aquisição por campanha.
- `/a/[slug]/completar` → conclusão do cadastro Google da campanha.

Rotas e fluxos planejados:
- `/omdx/diagnosticos` — área operacional com lista completa, filtros e ações, acessada pela sidebar.
- Criação/configuração de diagnóstico — drawer lateral dentro de `/omdx/diagnosticos`, sem página própria visível.
- `/omdx/[id]/acompanhamento` — coleta em andamento.
- `/omdx/[id]/resultado` e `/omdx/[id]/resultado/[dimensao]` — resultado executivo.
- `/r/[token]` (público, sem auth) — fluxo do respondente.

Regras de breadcrumb no Maturidade:
- `/omdx` não usa breadcrumb; é a raiz executiva do módulo.
- Camadas abaixo usam breadcrumb, por exemplo `Maturidade / Diagnósticos` e `Maturidade / Diagnósticos / Compartilhar`.
- Drawers de criação/configuração não têm breadcrumb próprio.
- `Diagnósticos` é item próprio na sidebar; não deve depender de CTA dentro do dashboard.

## Dados e mocks

O core de Maturidade e a aquisição por campanha usam Supabase versionado em `supabase/`. Páginas e componentes consomem `src/lib/data/`; route handlers de produção em `src/app/api/omdx/`, `src/app/api/acquisition/` e `src/app/api/admin/` escrevem via service role no servidor. Google OAuth exige e-mail Google verificado, domínio/e-mail permitidos para login corporativo ou intent de campanha ativo para cadastro de cliente. O fallback demo por senha usa `/api/auth/login` e `src/lib/auth/mock-auth.ts`; fica disponível apenas fora de produção e quando `AUTH_ENABLE_DEV_PASSWORD_LOGIN=true`.

Convenções:
- Componentes e páginas **não devem** importar `mock-data.ts` diretamente; use `src/lib/data/omdx-data-source.ts`.
- Superadmin e aquisição pública usam `src/lib/data/admin-data-source.ts` para helpers/DTOs e `src/lib/data/acquisition-data-source.ts` para Supabase server-side.
- Contratos vivem em `src/lib/contracts/` com Zod; `src/lib/types.ts` reexporta os tipos públicos.
- `Db*` representa formato futuro Supabase em `snake_case`; a UI usa domínio em `camelCase`.
- Conversões de banco para UI ficam em `src/lib/contracts/mappers.ts`.
- Dados realistas em pt-BR; nomes de empresas fictícios ("Vertex Logistics", "Lumen Health", etc.).
- Não introduza novas chamadas client-side diretas ao Supabase. Service role é somente server-side; clients RLS usam JWT assinado pela sessão Auth.js.

## UI, copy e acessibilidade

- **Texto visível** sempre em pt-BR com ortografia correta. Sem emoji. Sem ponto de exclamação em copy de produto.
- **Tom:** consultivo, direto, técnico. "Estruturação", "operação", "diagnóstico", "alavancagem" — não "transformação digital", "jornada", "DNA da empresa".
- **Tokens primeiro.** Use as variáveis CSS de `globals.css` (`bg-background`, `text-muted-foreground`, `border`, etc.). Não cole hex direto em componente.
- **Brand blue (`#185EFF`) é signal-grade.** Um CTA primário por tela. Nunca tile background.
- **Cards têm 1px border, sem shadow** por padrão. Sombras só em popovers e elementos elevados.
- **Tabelas operacionais ficam livres, não dentro de cards/boxes.** Siga o padrão de `src/components/omdx/diagnostics-workspace.tsx`: título, descrição e ações no fluxo da página; a tabela usa apenas o seu próprio wrapper `overflow-hidden rounded-lg border`.
- **Margem das páginas autenticadas:** use `AppPage`, com `px-6 py-8 lg:px-10` e conteúdo em largura total, seguindo as páginas de Dimensões. Limite de largura é exceção para leitura documental ou fluxos deliberadamente estreitos.
- **Tabular numerals** (`.tabular-nums` ou `font-variant-numeric: tabular-nums`) em KPIs, tabelas e qualquer número alinhável.
- **Use `cn()` de `@/lib/utils`** para compor classes condicionalmente.
- **Preserve contraste WCAG AA**, foco visível (ring brand de 2px), semântica HTML e navegação por teclado.
- **Evite "AI slop":** espaçamentos frouxos, cards espremidos, hierarquia genérica, gradientes blue-to-purple, ícones de fundo colorido com ícone dentro, animações com bounce/spring.
- **Responsividade:** teste em mobile (375px) quando alterar páginas públicas (fluxo do respondente).

## Convenções de código

- **Imports com alias `@/`** (configurado em `tsconfig.json`).
- **Exports nomeados**, salvo quando o framework exigir default (`page.tsx`, `layout.tsx`).
- **Sem `useMemo`/`useCallback` por padrão** — siga o padrão existente do arquivo. Otimize quando houver evidência de problema, não preventivamente.
- **Comentários raros e úteis.** Explique decisões não óbvias. Não descreva o que o código já diz.
- **Não duplique lógica entre mocks.** Se a regra de classificação de score precisa mudar, mude na camada `src/lib/data/`.
- **Não crie abstrações antes da terceira repetição.**

## Comandos de validação

```bash
npm run dev               # dev server (Turbopack) em :3000
npm run build             # build de produção
npm run lint              # ESLint
npm run test              # testes unitários Vitest
npm run test:e2e          # testes E2E Playwright
npx tsc --noEmit          # type-check
```

Para mudanças localizadas, prefira comandos direcionados:
```bash
npm run lint -- src/caminho/do/arquivo.tsx
```

Se não puder rodar algum comando, explique o motivo no fechamento da tarefa.

## Fluxos comuns

**Mudança em página do app autenticado:**
- Leia `src/app/CLAUDE.md`.
- A página fica dentro de `src/app/(app)/` para herdar sidebar + topbar.
- Componentes do domínio em `src/components/omdx/`; primitives em `src/components/ui/`.

**Mudança visual em componente:**
- Leia `src/components/CLAUDE.md` e, se for primitive, `src/components/ui/CLAUDE.md`.
- Preserve tokens, contraste, foco e responsividade.
- Conserte a causa estrutural, não só a captura atual.

**Mudança em contratos, data-source ou mocks:**
- Leia `src/lib/CLAUDE.md`.
- Ajuste contratos, data-source e mocks juntos. A forma pública dos dados deve permanecer estável para a futura API real encaixar.

**Adicionar nova rota/funcionalidade:**
- Crie a página dentro de `src/app/(app)/` ou `src/app/r/` (público) conforme o caso.
- Componentes do domínio em pasta dedicada de `src/components/<dominio>/`.
- Crie `CLAUDE.md` na pasta do domínio descrevendo propósito, componentes principais e estados.

## Definição de pronto

Uma entrega está pronta quando:
- O problema real foi resolvido — não apenas mascarado.
- O código continua consistente com os padrões locais (lidos no `CLAUDE.md` da pasta).
- A documentação relevante foi atualizada na mesma mudança.
- Mudanças estruturais, novas funcionalidades e alterações de fluxo foram registradas no Notion, ou a pendência foi reportada com resumo acionável quando não houver acesso ao Notion.
- `npx tsc --noEmit` e `npm run lint` passam.
- A interface foi verificada visualmente em light **e** dark, em pelo menos uma largura desktop e — se for página pública — em mobile.
- Nenhuma mudança alheia foi revertida.

## Manutenção deste arquivo

Atualize este arquivo quando mudar stack, comandos, arquitetura, fluxo de dados, convenções de agentes ou regras importantes do projeto. Ele deve permanecer **enxuto e operacional**; detalhes extensos vão para os `CLAUDE.md` locais ou para `docs/` (quando essa pasta existir).
