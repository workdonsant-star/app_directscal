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
| Button | `button.tsx` | variants: default, secondary, ghost, outline, destructive, link |
| Card | `card.tsx` | 1px border, sem shadow por padrão (decisão da marca) |
| Badge | `badge.tsx` | use para status discretos; status complexos têm wrapper em `omdx/status-badge.tsx` |
| Breadcrumb | `breadcrumb.tsx` | usado na topbar limpa do shell autenticado |
| Table | `table.tsx` | header em `bg-muted/40`, cells densas — use `tabular-nums` para números |
| Sidebar | `sidebar.tsx` | API extensa (Provider, Sidebar, SidebarMenuButton com `render`, …) |
| Collapsible | `collapsible.tsx` | primitive base-ui instalado pelo bloco `sidebar-07` |
| DropdownMenu | `dropdown-menu.tsx` | menu base-ui; trigger via `render` |
| Dialog | `dialog.tsx` | modal central base-ui para confirmações e decisões curtas |
| Tabs | `tabs.tsx` | filtros e seções dentro de cards |
| Tooltip | `tooltip.tsx` | provider com `delay`; conteúdo com setinha automática |
| Avatar | `avatar.tsx` | inicial 2 letras quando sem imagem |
| Input | `input.tsx` | sem `Label` próprio — use `<label>` HTML |
| Separator | `separator.tsx` | vertical e horizontal; usar com altura/largura definida |
| Select | `select.tsx` | seletor visual do sistema baseado em Base UI; usar no lugar de `<select>` nativo |
| Sheet | `sheet.tsx` | drawer mobile do sidebar usa internamente |
| Skeleton | `skeleton.tsx` | use para estados de carregamento |

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

## Quando reescrever um primitive

Quase nunca. Se o componente não atender:
1. Tente compor com classes Tailwind no consumidor.
2. Crie um wrapper no domínio.
3. Última opção: edite o primitive — e justifique no commit + atualize esta lista.
