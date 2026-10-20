# `src/components/ui` — Primitives do design system

Antes de editar, releia o **AGENTS.md** da raiz e o `CLAUDE.md` de `src/components/`.

## Propósito

Esta pasta contém os **primitives do shadcn/ui** — botões, cards, tabelas, sidebar, dropdowns, tooltips, etc. São os blocos de construção da interface. Componentes de domínio (em `src/components/<dominio>/`) **devem** compor a partir destes primitives.

## Versão e base

- Estilo: `base-nova` (configurado em `components.json`).
- **Base library: `@base-ui/react`**, não `@radix-ui/react`.
- Tailwind v4 com tokens em `src/app/globals.css`.
- Ícones: Lucide.

> Atenção: a base-ui mudou padrões da Radix. Antes de usar um componente, abra o arquivo dele aqui e confira a API.

## Diferenças importantes vs Radix

| Radix (antigo) | base-ui (atual) |
| --- | --- |
| `<DropdownMenuTrigger asChild><Button/></...>` | `<DropdownMenuTrigger render={<Button />}>` |
| `<TooltipProvider delayDuration={200}>` | `<TooltipProvider delay={200}>` |
| `<SidebarMenuButton asChild><Link/></...>` | `<SidebarMenuButton render={<Link />}>` |
| `data-state="open"` | `data-state="open"` (mantém) |

**Regra:** sempre que pensar em `asChild`, use `render={<Componente />}` no lugar.

## Componentes instalados

| Componente | Arquivo | Notas |
| --- | --- | --- |
| Button | `button.tsx` | `default` é CTA azul `#124BD1` com texto `#EFEFEE`; `outline` e `secondary` são neutros sem borda. Todos usam raio de 5px e mantêm as dimensões compactas atuais. |
| Card | `card.tsx` | sem borda, ring ou sombra: delimita pelo fundo `bg-card` contra o canvas (ver `docs/tokens-de-cor.md`) |
| Badge | `badge.tsx` | use para status discretos; status complexos têm wrapper em `omdx/status-badge.tsx` |
| Breadcrumb | `breadcrumb.tsx` | usado na topbar limpa do shell autenticado |
| Table | `table.tsx` | `variant="operational"` obrigatório em tabelas novas: cabeçalho de 44px, raio de 5px, linhas de 55px com divisórias finas, sem contorno externo ou fundo no hover; a variante operacional é o padrão de todos os consumidores; `default` é apenas uma opção explícita |
| Sidebar | `sidebar.tsx` | API extensa; abaixo de 1280px inicia na variante existente de ícones; em larguras maiores inicia expandida e continua colapsável |
| Collapsible | `collapsible.tsx` | primitive base-ui instalado pelo bloco `sidebar-07` |
| DropdownMenu | `dropdown-menu.tsx` | menu base-ui; trigger via `render`; não modal por padrão para preservar a scrollbar da página |
| Dialog | `dialog.tsx` | modal central base-ui para confirmações e decisões curtas |
| Tabs | `tabs.tsx` | novos botões seletores usam `TabsList variant="selector"`: 32px, gap de 32px, ativo neutro e sem sublinhado; `default` e `line` preservam consumidores legados |
| Tooltip | `tooltip.tsx` | provider com `delay`; conteúdo com setinha automática |
| Avatar | `avatar.tsx` | inicial 2 letras quando sem imagem |
| Input | `input.tsx` | sem `Label` próprio — use `<label>` HTML; o estado desabilitado resolve por `surface-disabled` nos dois temas |
| Separator | `separator.tsx` | vertical e horizontal; usar com altura/largura definida |
| Select | `select.tsx` | trigger Base UI neutro de 32px, sem borda, com raio de 5px e a chevron de abertura; não modal por padrão para preservar a scrollbar da página; usar no lugar de `<select>` nativo |
| Sheet | `sheet.tsx` | drawer mobile do sidebar usa internamente |
| Skeleton | `skeleton.tsx` | use para estados de carregamento |
| Switch | `switch.tsx` | toggle Base UI para estados binários; sempre acompanhe com label visível ou `aria-label` |

## Padrão de tabelas e seletores

A referência aprovada em 04/10/2026 é o frame `252:2` do Figma DirectScal App; tabela `252:438` e seletores `252:79`. Use as variantes compartilhadas, sem duplicar esses estilos em componentes de domínio. A introdução destas variantes é deliberada: o usuário definiu um padrão transversal para todas as próximas tabelas e botões seletores.

Na tabela, o arredondamento pertence às células externas do cabeçalho; `border-separate border-spacing-0` permite os quatro cantos. Divisórias pertencem às células do corpo. O cabeçalho usa `bg-muted` e o seletor ativo usa `bg-muted`, que correspondem às superfícies do Figma na paleta atual do app. Não trocar os tokens globais para adaptar os nomes dos tokens do arquivo Figma. As cores no escuro vêm das mesmas superfícies semânticas existentes.

`Table` continua expondo os primitives semânticos `TableHeader`, `TableRow`, `TableHead`, `TableBody` e `TableCell`. `Tabs` mantém a navegação por teclado e os estados Base UI. A variante altera somente aparência; seleção de registros, ordenação e filtragem precisam de comportamento próprio do domínio. Linhas podem crescer para conteúdo maior. Detalhes e exemplo em `docs/padroes-de-tabelas-e-seletores.md`.

## Como adicionar um primitive

```bash
npx shadcn@latest add <nome>
```

Isso baixa o componente para `src/components/ui/`. **Ao adicionar:**
1. Verifique a versão da API (procure `render` em vez de `asChild`).
2. Adicione o componente à tabela acima.
3. Se houver token novo (cor, raio, sombra), declare em `globals.css`.

## Anti-padrões

- **Editar primitives gerados** sem necessidade. Se precisar de variação, crie wrapper em `src/components/<dominio>/`.
- **Importar de `@radix-ui/react-*`**. A base mudou; use `@base-ui/react`.
- **Usar `<select>` nativo** em novas telas. Use `src/components/ui/select.tsx`, salvo exceção técnica explícita.
- **Hex literal em primitive.** Use sempre tokens (`bg-card`, `text-muted-foreground`).
- **Esquecer foco.** Os primitives já trazem ring de foco brand — não sobrescreva sem motivo.
- **Elemento interativo sem mãozinha.** Botões, triggers, itens de menu, tabs e selects devem preservar `cursor-pointer`; use `cursor-default` somente para elementos sem ação real.
- **Animações longas.** Tudo > 280ms quebra o registro da marca.

## Ajustes locais

- `SidebarProvider` limita o shell a `w-dvw max-w-dvw` com `overflow-x-clip`; não use `w-full` aqui, porque a sidebar cria um gap próprio.
- `SidebarInset` usa `basis-0`, `min-w-0`, `max-w-full` e `overflow-x-clip`; não use `w-full` no inset de conteúdo em layouts com sidebar.
- Abaixo de `1280px`, a sidebar desktop usa `collapsible="icon"` recolhida por padrão. O `Sheet` permanece exclusivo do mobile real, abaixo de `768px`.

## Quando reescrever um primitive

Quase nunca. Se o componente não atender:
1. Tente compor com classes Tailwind no consumidor.
2. Crie um wrapper no domínio.
3. Última opção: edite o primitive — e justifique no commit + atualize esta lista.

- Sidebar encaminha a classe do consumidor ao SheetContent móvel para que a superfície do shell seja igual no drawer e no desktop.

O padrão das Dimensões é aplicado por omissão em `Table`, incluindo documentos. A última linha não tem divisória inferior. Cabeçalhos semibold antigos passam a medium.

- Hovers usam cores neutras, nunca azul: texto `foreground` e superfícies `action-neutral-hover` com texto `action-neutral-foreground`. O sumário documental também mantém o item ativo em `foreground`, branco no escuro e escuro no claro.

- Seletor Lucide usa Popover Base UI não modal, com 320px, ancorado nos três pontos da categoria. Sem backdrop/blur ou bloqueio da página; busca e grade de oito colunas com rolagem interna. Posicionamento considera os limites da viewport, Escape e clique fora fecham.

- DropdownMenuContent e submenus têm superfície minimalista com borda discreta de 0,5px usando border-border, igual às divisórias da tabela, sem ring decorativo e sem sombra. Mantêm tokens de popover, arredondamento, estados de foco e navegação Base UI. A mudança no primitive é deliberada para uniformizar todos os menus suspensos ao padrão solicitado.

- Menus suspensos, submenus e o popup do Select usam bg-muted e text-foreground para compartilhar o fundo do cabeçalho da tabela nos dois temas, mantendo borda discreta e sem sombra.

- Superfícies seguem `docs/tokens-de-cor.md`. Input é preenchido (`bg-input`, borda transparente em repouso); aba ativa do seletor e hover do botão ghost usam `bg-accent`, translúcido, igual nos dois temas e sem overrides `dark:`.

- Painéis Sheet laterais (esquerda/direita) compartilham o acabamento do shell: raio rounded-2xl (20px), recuo de 8px em relação à janela e altura automática entre os recuos. Overflow fica recortado pela superfície para preservar cantos durante rolagem; cada consumidor mantém sua área interna rolável. Largura máxima de viewport menos 16px, inclusive em consumidores com largura própria. Mudança global deliberada para uniformizar os painéis laterais. Sheets de cima/baixo preservam geometria existente.

- `CardTitle`, `DialogTitle` e `SheetTitle` usam `font-heading text-ui-title` (16/24, 700). Tipografia em `docs/tokens-de-tipografia.md`.
