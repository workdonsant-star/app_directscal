# `src/app` — Rotas, layouts e App Router

Antes de editar arquivos aqui, releia o **AGENTS.md** da raiz e este documento.

## Propósito

`src/app` contém **rotas, layouts, metadata e o globals.css** do projeto, no formato do **App Router** do Next.js 16. Não há páginas legadas, não há Pages Router.

## Estrutura atual

```
src/app/
├── (app)/                    ← route group autenticado (cliente administrador)
│   ├── layout.tsx            ← shell autenticado com sidebar-07 adaptado
│   └── omdx/
│       ├── page.tsx          ← dashboard executivo do módulo OMDx
│       ├── diagnosticos/     ← área operacional (lista + drawer)
│       └── [id]/
│           └── compartilhar/page.tsx ← central mockada de coleta
│   └── insights/
│       ├── page.tsx          ← redirect para /insights/cultura
│       └── [dimensao]/page.tsx ← dashboard compacto por dimensão
│   └── metodologia/
│       └── page.tsx          ← explicação executiva da metodologia OMDx
│   └── docs/
│       └── page.tsx          ← manual prático de uso do módulo OMDx
│   └── perfil/
│       └── page.tsx          ← perfil mockado do usuário e da empresa
├── r/
│   └── [token]/page.tsx      ← prévia pública mockada do respondente
├── globals.css               ← tokens da Directscal mapeados para shadcn
├── layout.tsx                ← root: <html> <body>, ThemeProvider, fontes
└── page.tsx                  ← redirect("/omdx")
```

## Dados e contratos

- Páginas devem consumir dados por `src/lib/data/`, não por arrays de `src/lib/mock-data.ts`.
- `mock-data.ts` é seed temporário usado pela camada de data-source.
- Contratos de API/banco ficam em `src/lib/contracts/` com schemas Zod.
- A preparação é Supabase-friendly, mas sem backend real, server actions ou migrations nesta fase.

## Convenções

- **Server Components por padrão.** `"use client"` somente quando houver estado, efeito, browser API ou interação real. O dashboard atual é Server Component; os filhos interativos (tabela com filtro, theme toggle) é que são `"use client"`.
- **Route groups com parênteses** (`(app)`, futuramente `(public)`) **não criam segmento de URL** — servem para agrupar rotas que compartilham layout. Use sempre que um conjunto de rotas precisar do mesmo chrome.
- **Redirects no servidor** com `redirect()` de `next/navigation` (vide `src/app/page.tsx`).
- **Metadata** vem de `export const metadata` em `layout.tsx` e `page.tsx`.
- O favicon atual é `public/favicon.svg.svg`, registrado no metadata global.
- **Fontes** declaradas no root `layout.tsx` via `next/font/google` e expostas como variáveis CSS (`--font-inter`, `--font-instrument-serif`, `--font-jetbrains-mono`).
- **Dark mode** controlado por `next-themes` (atributo `class` em `<html>`). Default: `system`, com `enableSystem`; o usuário pode alternar manualmente claro/escuro pelo dropdown do usuário.

## globals.css — regras

`globals.css` é a **única** fonte de tokens do app. Não duplique cores ou raios em outro lugar.

- Usa Tailwind v4: tokens declarados em `@theme inline { ... }` com `var(--*)`.
- Tokens da marca em `:root` (light) e `.dark` (dark mode).
- Sempre que adicionar um token novo (ex.: nova cor de chart), declare em `@theme inline` **e** nos dois temas.
- Não use unidades diferentes do design system: spacing 4px-base, raios 0/4/6/10/14/20/999px, durations 120/180/280ms.
- O app desativa o overscroll elástico do macOS com `overscroll-behavior: none` no viewport e em containers internos de scroll.
- O shell autenticado bloqueia scroll horizontal no wrapper da sidebar e no `SidebarInset`; páginas internas não devem depender de overflow horizontal do documento.
- Elementos clicáveis/interativos devem exibir cursor de mão. A regra global cobre tags semânticas e `data-slot` dos primitives; novos primitives devem respeitar esse padrão e só usar `cursor-default` quando o elemento não tiver ação real.

## Rotas atuais e planejadas

Quando criar essas rotas, abra um `CLAUDE.md` na nova pasta:

| Rota | Pasta | Propósito |
| --- | --- | --- |
| `/omdx` | `(app)/omdx/` | Dashboard executivo do módulo; não deve conter a lista operacional completa. |
| `/omdx/diagnosticos` | `(app)/omdx/diagnosticos/` | Área operacional acessada pela sidebar, com lista, filtros, criação e configuração em drawer lateral. |
| `/omdx/[id]/compartilhar` | `(app)/omdx/[id]/compartilhar/` | Central de coleta mockada com links por grupo, copy sugerida e resumo compacto. |
| `/omdx/[id]/acompanhamento` | `(app)/omdx/[id]/acompanhamento/` | Coleta em andamento |
| `/omdx/[id]/resultado` | `(app)/omdx/[id]/resultado/` | Visão executiva |
| `/omdx/[id]/resultado/[dimensao]` | `(app)/omdx/[id]/resultado/[dimensao]/` | Detalhe por dimensão |
| `/insights` | `(app)/insights/` | Redireciona para `/insights/cultura`. |
| `/insights/[dimensao]` | `(app)/insights/[dimensao]/` | Dashboard agregado por dimensão, com filtro por diagnóstico. |
| `/metodologia` | `(app)/metodologia/` | Página executiva sobre método, dimensões, camadas, escala e interpretação do OMDx. |
| `/docs` | `(app)/docs/` | Documentação prática em página única para uso do módulo pelo cliente administrador. |
| `/perfil` | `(app)/perfil/` | Perfil mockado do usuário: nome, e-mail bloqueado, senha e dados básicos da empresa. |
| `/r/[token]` | `r/[token]/` | Prévia pública mockada do respondente — **fora** do route group `(app)`, sem sidebar/topbar |

## Navegação e breadcrumb

- O shell autenticado usa o bloco shadcn `sidebar-07` como base visual, adaptado para Directscal.
- A sidebar colapsa para ícones e mantém `OMDx` e `Diagnósticos` como itens separados.
- A sidebar tem uma seção `Insights` com as seis dimensões do OMDx.
- `Empresas` e `Relatórios` não fazem parte da navegação principal nesta fase.
- A topbar é limpa: trigger da sidebar, separador e breadcrumb quando houver camada.
- `/omdx` é a raiz do módulo e não usa breadcrumb na topbar.
- Páginas abaixo de `/omdx` usam breadcrumb para mostrar a camada atual.
- `/omdx/diagnosticos` usa `OMDx / Diagnósticos`.
- `/omdx/[id]/compartilhar` usa `OMDx / Diagnósticos / Compartilhar`.
- `/insights/[dimensao]` usa `Insights / Nome da dimensão`.
- `/metodologia` usa `Metodologia`.
- `/docs` usa `Documentação`.
- `/perfil` usa `Perfil`.
- Futuras rotas de acompanhamento e resultado usam `OMDx / Diagnósticos / ...`.
- Criação e configuração não devem abrir páginas próprias; acontecem em drawer dentro de `/omdx/diagnosticos`.
- `Diagnósticos` deve ser item da sidebar; não use CTA no dashboard para acessar essa área.
- As rotas temporárias `/omdx/novo` e `/omdx/[id]/configurar`, enquanto existirem, devem redirecionar para `/omdx/diagnosticos` ou indicar depreciação.

## Largura de página

- Páginas autenticadas com conteúdo principal, formulários, tabelas ou dashboards devem usar o mesmo container base da metodologia: `mx-auto w-full max-w-6xl`.
- O padding externo recomendado é `px-6 py-8 lg:px-10`.
- Páginas documentais com sumário lateral mantêm o grid `max-w-6xl` com coluna de conteúdo em torno de `760px`.
- Estados centralizados, páginas públicas e drawers podem ter larguras próprias quando a experiência exigir.

## Estados a prever em cada página

Ao construir qualquer página, lembre dos estados levantados no plano original do OMDx:

1. Sem dado / empty state
2. Carregando (skeleton)
3. Conteúdo
4. Erro ao carregar
5. Estados específicos do domínio (rascunho, ativo, encerrado, link inválido, link expirado, já respondeu, respostas insuficientes)

Estados ainda não estão todos implementados — quando construir, prefira **componentes de estado dedicados** dentro do domínio (`src/components/omdx/`) em vez de espalhar `if/else` na página.

## Fluxo do respondente — quando chegar a hora

A pasta `src/app/r/[token]/` será **um layout próprio**, não dentro de `(app)`:
- Sem sidebar e sem topbar do produto.
- Logo Directscal discreto, max-width estreito.
- Sem auth, completamente público.
- O grupo (sócios / liderança / time) vem do **token da URL**, não do respondente.
- Nesta fase, `/r/[token]` é só uma prévia mockada da introdução pública; o formulário Likert completo vem depois.

## Anti-padrões

- Importar `mock-data.ts` em páginas, layouts ou componentes. Use `src/lib/data/`.
- Espalhar `"use client"` no topo da página inteira só porque um filho precisa — extraia o filho interativo.
- Adicionar metadata específica de página no `layout.tsx` global.
- Criar nova rota sem documentar o estado dela aqui.
