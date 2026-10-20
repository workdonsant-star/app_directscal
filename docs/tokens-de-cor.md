# Tokens de cor — superfícies em claro e escuro

Revisão de 18/10/2026. Fonte única: `src/app/globals.css`.

## Princípio

A hierarquia vem do **fundo do componente contra o fundo onde ele está**, não de bordas. Os dois temas usam a mesma escala; só os valores mudam. Um componente nunca precisa de `dark:` para trocar superfície.

## Escala

| Token | Papel | Claro | Escuro | Classe |
| --- | --- | --- | --- | --- |
| `surface-shell` | Moldura: sidebar e topbar | `#F4F4F4` | `#161616` | `bg-shell`, `bg-sidebar` |
| `surface-canvas` | Área de conteúdo (raio de 20px) | `#FFFFFF` | `#0B0B0B` | `bg-background` |
| `surface-card` | Bloco sobre o canvas | `#F4F4F4` | `#181818` | `bg-card` |
| `surface-control` | Fundo neutro estático: cabeçalho de tabela, menus, chips, blocos dentro de card | `#EBEBEB` | `#262626` | `bg-muted`, `bg-secondary` |
| `surface-popover` | Flutuantes: sheet, dialog, popover | `#FFFFFF` | `#1F1F1F` | `bg-popover` |
| `surface-field` | Campos e botões neutros em repouso (translúcido) | preto 5% | branco 6% | `bg-input`, `bg-action-neutral` |
| `surface-selected` | Hover, item ativo, aba selecionada (translúcido) | preto 8% | branco 9% | `bg-accent`, `bg-sidebar-accent`, `bg-action-neutral-hover` |

`surface-field` e `surface-selected` são translúcidos de propósito: sobre canvas, card, shell ou menu, sempre produzem um degrau visível, sem depender de onde o componente está.

Aliases legados (`surface-sidebar`, `surface-sidebar-selected`, `surface-subtle`, `surface-table-header`) apontam para a escala acima e não devem ser usados em código novo.

## Regras de uso

- Card sobre canvas: `bg-card`, sem `border` nem `ring`.
- Bloco dentro de card: `bg-muted`. Dentro de `bg-muted`, volte para `bg-background`.
- Campos (`Input`, textarea, composer): `border-transparent bg-input`; a borda aparece só no foco.
- Hover e seleção: `bg-accent` (ou `sidebar-accent` na sidebar). Nunca azul.
- Sheets e dialogs: `bg-popover` (padrão do primitive); não sobrescrever com `bg-card`.
- Bordas ficam para divisórias (tabela, separadores, `border-b` de cabeçalho), não para delimitar blocos.
- Estados vazios usam `bg-card`, sem tracejado.
