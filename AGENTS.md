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
    │   └── omdx/CLAUDE.md             ← componentes do módulo OMDx
    └── lib/CLAUDE.md                  ← types, mock data, utils
```

Ao criar uma pasta nova com responsabilidade clara (novo módulo, novo domínio, nova feature substancial), **gere um `CLAUDE.md` na raiz dela**. Se uma pasta perder relevância, atualize ou remova o doc local.

## Contexto do produto

**Directscal** é uma empresa de serviços e tecnologia focada em estruturação de negócios digitais que precisam crescer. A marca opera na tensão deliberada **metodologia tradicional, execução moderna** — rigor de consultoria com a densidade de produto Vercel/shadcn.

Este repositório implementa o **OMDx** — Diagnóstico de Maturidade Operacional. O OMDx avalia empresas em seis dimensões (Cultura, Visão, Comunicação, Processos, Liderança, Performance) a partir da percepção de três grupos: Fundador, Liderança e Operação.

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
- **next-themes** para dark mode (default `dark`, sem system).
- **lucide-react** para ícones.
- Fontes Google: **Inter** (sans), **Instrument Serif** (display itálico), **JetBrains Mono** (mono — substitui IBM Plex Mono do design system original).

Estado atual: **scaffold inicial + dashboard do administrador**. Não há ainda backend, autenticação, banco, testes E2E ou unitários. Tudo opera com **mock data** estática em `src/lib/mock-data.ts`. A primeira prioridade é validar interface e fluxos antes de qualquer motor de API.

## Fontes de verdade

| Área | Onde olhar |
| --- | --- |
| Regras globais para agentes | `AGENTS.md` (este arquivo) |
| Design system da marca | `Directscal Design System/README.md` e `Directscal Design System/colors_and_type.css` |
| Tokens portados para o app | `src/app/globals.css` |
| Rotas, layouts, App Router | `src/app/CLAUDE.md` |
| Padrões de componentes | `src/components/CLAUDE.md` |
| Primitives shadcn/ui | `src/components/ui/CLAUDE.md` |
| Componentes do módulo OMDx | `src/components/omdx/CLAUDE.md` |
| Types, mock data e utils | `src/lib/CLAUDE.md` |

A pasta `Directscal Design System/` é **fonte canônica de marca** (cores, tipografia, voz, componentes de referência). Não edite arquivos lá dentro sem motivo claro — eles foram gerados a partir do logo e da definição de marca da empresa.

## Regras de trabalho

- **Preserve mudanças do usuário.** O repositório pode estar sujo; nunca reverta arquivos que você não alterou.
- **Mudanças pequenas, coesas e verificáveis.** Sem refactor oportunista no meio de bug fix.
- **Não adicione dependências sem necessidade clara.** Se adicionar, justifique no commit ou no `CLAUDE.md` local.
- **Não copie padrões antigos sem validar.** Esta é uma stack nova (Next 16, React 19, Tailwind 4, shadcn base-ui) — boa parte da memória de treinamento é obsoleta.
- **Não exponha segredos**, tokens, dados pessoais reais ou valores de produção.
- **Se alterar comportamento, ajuste a documentação local** (`CLAUDE.md` da pasta) na mesma mudança.
- **Antes de "consertar" algo, entenda a causa raiz.** Não mascare sintomas.
- **Foco em interface e fluxos primeiro.** Não introduza motor de API, banco ou autenticação até o usuário pedir explicitamente.

## Next.js 16

Antes de escrever ou alterar código de Next.js:
- Consulte a documentação local em `node_modules/next/dist/docs/` quando houver dúvida sobre API.
- Não assuma APIs antigas (Pages Router, `getServerSideProps`, `_app`, etc.).
- **Server Components por padrão.** Use `"use client"` apenas quando houver estado, efeitos, browser APIs ou interatividade real.
- Use `redirect()` de `next/navigation` para redirects no servidor (existe em `src/app/page.tsx`).
- Route groups com `(nome)` não criam segmento de URL — usados aqui em `src/app/(app)/` para o layout autenticado.

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
│   ├── (app)/                ← route group autenticado (sidebar + topbar)
│   │   ├── layout.tsx        ← SidebarProvider + AppSidebar + SidebarInset
│   │   └── omdx/page.tsx     ← dashboard do cliente administrador
│   ├── globals.css           ← tokens da Directscal mapeados p/ shadcn
│   ├── layout.tsx            ← root layout, ThemeProvider, fontes
│   └── page.tsx              ← redirect("/omdx")
├── components/
│   ├── ui/                   ← primitives shadcn (button, card, sidebar, …)
│   ├── omdx/                 ← componentes do módulo OMDx
│   ├── app-sidebar.tsx       ← sidebar global do app autenticado
│   ├── app-topbar.tsx        ← topbar com breadcrumb + ações
│   ├── theme-provider.tsx    ← wrapper de next-themes
│   └── theme-toggle.tsx      ← botão sol/lua
└── lib/
    ├── mock-data.ts          ← dimensões, diagnósticos, KPIs fictícios
    ├── types.ts              ← tipos de domínio
    └── utils.ts              ← cn() (clsx + tailwind-merge)
```

Rotas atuais:
- `/` → redireciona para `/omdx`.
- `/omdx` → dashboard do administrador (lista de diagnósticos + visão executiva).

Rotas planejadas (ainda não implementadas):
- `/omdx/novo`, `/omdx/[id]/configurar` — criação/edição.
- `/omdx/[id]/compartilhar` — links públicos por grupo (sócios / liderança / time).
- `/omdx/[id]/acompanhamento` — coleta em andamento.
- `/omdx/[id]/resultado` e `/omdx/[id]/resultado/[dimensao]` — resultado executivo.
- `/r/[token]` (público, sem auth) — fluxo do respondente.

## Dados e mocks

**A camada atual é 100% mockada e síncrona.** Não existe API, banco ou autenticação. Toda página lê direto de `src/lib/mock-data.ts`.

Convenções:
- Componentes **podem** importar `mock-data.ts` diretamente nesta fase. Quando o backend chegar, isso será trocado por hooks (TanStack Query ou similar) sem alterar a forma dos dados.
- Tipos vivem em `src/lib/types.ts` e devem espelhar a forma esperada da API real.
- Dados realistas em pt-BR; nomes de empresas fictícios ("Vertex Logistics", "Lumen Health", etc.).
- Não introduza chamadas a APIs externas, fetches, server actions ou Supabase neste momento.

## UI, copy e acessibilidade

- **Texto visível** sempre em pt-BR com ortografia correta. Sem emoji. Sem ponto de exclamação em copy de produto.
- **Tom:** consultivo, direto, técnico. "Estruturação", "operação", "diagnóstico", "alavancagem" — não "transformação digital", "jornada", "DNA da empresa".
- **Tokens primeiro.** Use as variáveis CSS de `globals.css` (`bg-background`, `text-muted-foreground`, `border`, etc.). Não cole hex direto em componente.
- **Brand blue (`#185EFF`) é signal-grade.** Um CTA primário por tela. Nunca tile background.
- **Cards têm 1px border, sem shadow** por padrão. Sombras só em popovers e elementos elevados.
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
- **Não duplique lógica entre mocks.** Se a regra de classificação de score precisa mudar, mude em `mock-data.ts` (a função `classifyScore`).
- **Não crie abstrações antes da terceira repetição.**

## Comandos de validação

```bash
npm run dev               # dev server (Turbopack) em :3000
npm run build             # build de produção
npm run lint              # ESLint
npx tsc --noEmit          # type-check
```

Ainda não há `test:unit`, `test:e2e` ou similar — adicionar quando o backend entrar.

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

**Mudança em mock data ou types:**
- Leia `src/lib/CLAUDE.md`.
- Ajuste types **e** mocks juntos. A forma dos dados deve permanecer estável para a futura API real encaixar.

**Adicionar nova rota/funcionalidade:**
- Crie a página dentro de `src/app/(app)/` ou `src/app/r/` (público) conforme o caso.
- Componentes do domínio em pasta dedicada de `src/components/<dominio>/`.
- Crie `CLAUDE.md` na pasta do domínio descrevendo propósito, componentes principais e estados.

## Definição de pronto

Uma entrega está pronta quando:
- O problema real foi resolvido — não apenas mascarado.
- O código continua consistente com os padrões locais (lidos no `CLAUDE.md` da pasta).
- A documentação relevante foi atualizada na mesma mudança.
- `npx tsc --noEmit` e `npm run lint` passam.
- A interface foi verificada visualmente em light **e** dark, em pelo menos uma largura desktop e — se for página pública — em mobile.
- Nenhuma mudança alheia foi revertida.

## Manutenção deste arquivo

Atualize este arquivo quando mudar stack, comandos, arquitetura, fluxo de dados, convenções de agentes ou regras importantes do projeto. Ele deve permanecer **enxuto e operacional**; detalhes extensos vão para os `CLAUDE.md` locais ou para `docs/` (quando essa pasta existir).
