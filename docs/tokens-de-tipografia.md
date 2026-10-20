# Tokens de tipografia — interface e documentos

Revisão de 18/10/2026. Fonte única: `@theme inline` em `src/app/globals.css`.

## Princípio

A tipografia tem dois contextos com tokens separados:

- **Interface (`ui`)**: shell, páginas, cards, formulários, tabelas operacionais e dashboards.
- **Documentos (`doc`)**: ativos de gestão (SOPs, Playbooks, Governança, RACI) no leitor e no editor.

Hoje os dois usam as mesmas famílias. A separação existe para que os documentos possam ganhar outra família ou outro ritmo de leitura sem tocar na interface. Leitor e editor usam exatamente os mesmos tokens, então o que se edita é o que se publica.

## Famílias

| Token | Classe | Fonte atual | Uso |
| --- | --- | --- | --- |
| `--font-ui` / `--font-sans` | `font-sans` (padrão do body) | Funnel Sans | Corpo e controles da interface |
| `--font-ui-heading` / `--font-heading` | `font-heading` | Plus Jakarta Sans | Títulos da interface; `h1`–`h6` já herdam |
| `--font-doc` | `font-doc` | Funnel Sans | Corpo dos ativos de gestão |
| `--font-doc-heading` | `font-doc-heading` | Plus Jakarta Sans | Títulos dos ativos de gestão |
| `--font-label` | `font-label` | JetBrains Mono | Rótulos de métrica e de metadado (com `text-ui-label` ou `text-doc-label`) |
| `--font-mono` | `font-mono` | JetBrains Mono | Código, ids, domínios, marcadores numéricos |

Instrument Serif, Instrument Sans e Roboto Flex foram removidas do carregamento: não tinham nenhum uso.

## Pesos

Três pesos no sistema inteiro, para que a hierarquia fique evidente:

| Peso | Classe | Uso |
| --- | --- | --- |
| 400 | `font-normal` (padrão) | Corpo, descrições, células de tabela |
| 500 | `font-medium` | Rótulos, botões, cabeçalho de tabela, nomes em linha, ênfase discreta |
| 700 | `font-bold` | Todos os títulos (página, seção, card, documento), números de destaque e `strong` nos documentos |

`font-semibold` (600) saiu do sistema. A única exceção é `text-ui-kpi`, que mantém peso 300 do Figma para números grandes.

## Tamanho mínimo

Nada abaixo de 12px (`text-xs`). Os antigos 10px e 11px foram promovidos para 12px.

## Escala da interface

Segue a escala do Tailwind (12/14/16/20/24), referência de mercado para produto denso.

| Classe | Tamanho / altura | Peso | Uso |
| --- | --- | --- | --- |
| `text-ui-kpi` | 40 / 40, −0,02em | 300 | Número principal de KPI (com `tabular-nums`) |
| `text-ui-page` | 24 / 32, −0,02em | 700 | Título da página (`h1`) |
| `text-ui-section` | 20 / 28, −0,01em | 700 | Título de seção, título de painel lateral |
| `text-ui-title` | 16 / 24 | 700 | Título de card, diálogo e sheet |
| `text-ui-label` + `font-label` | 12 / 16, −0,01em, mono | 400 | Rótulo de KPI e métrica (“Adoção”), eyebrow de sumário, rótulos de detalhe |
| `text-sm` | 14 / 20 | 400–500 | Corpo, labels, tabelas, botões |
| `text-xs` | 12 / 16 | 400–500 | Legendas, badges, metadados, subtítulos do shell |

## Escala dos documentos

Segue o Tailwind Typography (`prose`): corpo de 16px com altura de linha de 1,75 para leitura longa.

| Classe | Tamanho / altura | Peso | Uso |
| --- | --- | --- | --- |
| `text-doc-title` | 36 / 40, −0,025em | 700 | Título do ativo |
| `text-doc-h2` | 24 / 32, −0,02em | 700 | Seção (H2) |
| `text-doc-h3` | 20 / 28 | 700 | Subseção (H3) |
| `text-doc-body` | 16 / 28 | 400 | Parágrafos e listas, em `muted-foreground` |
| `text-doc-table` | 14 / 24 | 400 | Tabelas do documento |
| `text-doc-label` + `font-label` | 12 / 16, −0,01em, mono | 400 | Rótulos de metadados do ativo, sem caixa alta |

## Mono

A JetBrains Mono tem um papel só: dizer “isto é o nome de uma métrica ou de um metadado”. Ela marca o rótulo, nunca o valor. Números de KPI continuam em Funnel Sans com `tabular-nums`. Não use mono em títulos, corpo, botões ou cabeçalhos de tabela. Rótulos em mono ficam em minúsculas (sentence case); caixa alta em mono a 12px pesa demais.

## `cn()` e tokens

`src/lib/utils.ts` registra os tokens `text-ui-*`, `text-doc-*` e as famílias no `tailwind-merge`. Sem isso, `cn("text-ui-label", "text-muted-foreground")` descartava o tamanho, porque o merge tratava o token como cor. Ao criar um token tipográfico novo, inclua-o ali; `tests/unit/cn-typography-tokens.test.ts` cobre o comportamento.

## Regras

- Não use tamanhos arbitrários (`text-[17px]`, `text-[10px]`…). Se nenhum token servir, crie um na escala certa.
- Use só `font-normal`, `font-medium` e `font-bold`.
- Os tokens já trazem peso, altura de linha e tracking; não repita `font-semibold`, `leading-*` ou `tracking-*` junto deles.
- Token `doc-*` só dentro de ativos de gestão. Telas de edição ao redor do documento (formulários, cabeçalhos de edição) são interface e usam `ui-*`.
- Landing de marketing (`components/marketing/`) e as telas legadas `sops/` e `role-matrix/` ficaram fora desta revisão.
