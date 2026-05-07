# `src/app` — Rotas, layouts e App Router

Antes de editar arquivos aqui, releia o **AGENTS.md** da raiz e este documento.

## Propósito

`src/app` contém **rotas, layouts, metadata e o globals.css** do projeto, no formato do **App Router** do Next.js 16. Não há páginas legadas, não há Pages Router.

## Estrutura atual

```
src/app/
├── (app)/                    ← route group autenticado (cliente administrador)
│   ├── layout.tsx            ← SidebarProvider + AppSidebar + SidebarInset + TooltipProvider
│   └── omdx/
│       └── page.tsx          ← dashboard inicial do módulo OMDx
├── globals.css               ← tokens da Directscal mapeados para shadcn
├── layout.tsx                ← root: <html> <body>, ThemeProvider, fontes
└── page.tsx                  ← redirect("/omdx")
```

## Convenções

- **Server Components por padrão.** `"use client"` somente quando houver estado, efeito, browser API ou interação real. O dashboard atual é Server Component; os filhos interativos (tabela com filtro, theme toggle) é que são `"use client"`.
- **Route groups com parênteses** (`(app)`, futuramente `(public)`) **não criam segmento de URL** — servem para agrupar rotas que compartilham layout. Use sempre que um conjunto de rotas precisar do mesmo chrome.
- **Redirects no servidor** com `redirect()` de `next/navigation` (vide `src/app/page.tsx`).
- **Metadata** vem de `export const metadata` em `layout.tsx` e `page.tsx`.
- **Fontes** declaradas no root `layout.tsx` via `next/font/google` e expostas como variáveis CSS (`--font-inter`, `--font-instrument-serif`, `--font-jetbrains-mono`).
- **Dark mode** controlado por `next-themes` (atributo `class` em `<html>`). Default: `dark`. `enableSystem={false}` para evitar flicker e manter consistência com a tela do designer.

## globals.css — regras

`globals.css` é a **única** fonte de tokens do app. Não duplique cores ou raios em outro lugar.

- Usa Tailwind v4: tokens declarados em `@theme inline { ... }` com `var(--*)`.
- Tokens da marca em `:root` (light) e `.dark` (dark mode).
- Sempre que adicionar um token novo (ex.: nova cor de chart), declare em `@theme inline` **e** nos dois temas.
- Não use unidades diferentes do design system: spacing 4px-base, raios 0/4/6/10/14/20/999px, durations 120/180/280ms.

## Rotas planejadas

Quando criar essas rotas, abra um `CLAUDE.md` na nova pasta:

| Rota | Pasta | Propósito |
| --- | --- | --- |
| `/omdx/novo` | `(app)/omdx/novo/` | Criar diagnóstico |
| `/omdx/[id]/configurar` | `(app)/omdx/[id]/configurar/` | Editar rascunho |
| `/omdx/[id]/compartilhar` | `(app)/omdx/[id]/compartilhar/` | Links públicos por grupo |
| `/omdx/[id]/acompanhamento` | `(app)/omdx/[id]/acompanhamento/` | Coleta em andamento |
| `/omdx/[id]/resultado` | `(app)/omdx/[id]/resultado/` | Visão executiva |
| `/omdx/[id]/resultado/[dimensao]` | `(app)/omdx/[id]/resultado/[dimensao]/` | Detalhe por dimensão |
| `/r/[token]/...` | `r/[token]/` | Fluxo público do respondente — **fora** do route group `(app)`, com layout próprio (sem sidebar) |

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

## Anti-padrões

- Importar `mock-data.ts` em layout root (mantenha layouts neutros, dados nas pages).
- Espalhar `"use client"` no topo da página inteira só porque um filho precisa — extraia o filho interativo.
- Adicionar metadata específica de página no `layout.tsx` global.
- Criar nova rota sem documentar o estado dela aqui.
