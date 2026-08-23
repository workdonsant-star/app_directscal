# Directscal Design System

Documento de referência para alinhar site, produto e futuras aplicações Directscal. Use este arquivo como contrato de design antes de pedir a outra IA para criar telas, componentes, páginas ou assets.

## Princípio de marca

Directscal combina metodologia tradicional e execução moderna. A interface deve parecer consultiva, precisa e densa, com rigor de produto. A qualidade vem de tipografia, hierarquia, espaçamento e consistência, não de ornamento.

Diretrizes de linguagem:

- Português do Brasil como superfície primária.
- Sentence case em títulos, botões, labels e navegação.
- Tom direto, técnico e consultivo.
- Preferir: estruturação, operação, diagnóstico, alavancagem, modelo, escala, responsabilidade.
- Evitar: transformação digital, jornada, DNA, incrível, disruptivo.
- Sem emoji e sem ponto de exclamação em UI.
- Maturidade V2 deve manter vocabulário operacional: Membros da Operação, Papéis Operacionais, Responsabilidades, Nível de Autonomia.

## Fontes de verdade atuais

No app Next:

- Tokens CSS: `src/app/globals.css`.
- Fontes globais: `src/app/layout.tsx`.
- Primitives: `src/components/ui/`.
- Regras locais: `AGENTS.md`, `src/app/CLAUDE.md`, `src/components/CLAUDE.md`, `src/components/ui/CLAUDE.md`.
- Config shadcn: `components.json`, com `style: base-nova`, `@base-ui/react`, Tailwind 4 e Lucide.

Fonte canônica esperada de marca, quando presente no checkout:

- `Directscal Design System/README.md`.
- `Directscal Design System/colors_and_type.css`.

Regra prática: novas superfícies devem consumir tokens semânticos. Hex literal só entra dentro de arquivos de tokens, assets SVG ou documentos PDF que não conseguem consumir CSS variables.

## Sistema de cor

### Cor principal

O azul Directscal é sinal, não decoração. Use para CTA principal, foco, seleção, links ativos e indicadores importantes.

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-brand-50` | `#F4F7FF` | Fundo muito leve de marca |
| `--color-brand-100` | `#E6EDFF` | Fundo leve de marca |
| `--color-brand-200` | `#C2D2FF` | Fundo/linha secundária |
| `--color-brand-300` | `#88AAFF` | Destaque leve |
| `--color-brand-400` | `#4A82FF` | Destaque médio |
| `--color-brand-500` | `#185EFF` | Brand blue, CTA primário |
| `--color-brand-600` | `#1450DB` | Hover/press de CTA |
| `--color-brand-700` | `#0F3FAE` | Estado ativo/escuro |

Regra de aplicação:

- Um CTA primário por tela.
- Não usar `#185EFF` como fundo de tile ou card grande.
- Se uma superfície precisa ser mais rica, use imagem, dado, composição ou gradiente controlado, não blocos azuis repetidos.

### Tokens semânticos, light

| Token | Valor atual | Uso |
| --- | --- | --- |
| `--background` | `#FFFFFF` | Canvas principal |
| `--foreground` | `#111114` | Texto primário |
| `--card` | `#FFFFFF` | Superfície de card |
| `--card-foreground` | `#111114` | Texto em card |
| `--popover` | `#FFFFFF` | Menus, popovers, selects |
| `--popover-foreground` | `#111114` | Texto em popover |
| `--primary` | `#185EFF` | Ação primária |
| `--primary-foreground` | `#FFFFFF` | Texto sobre primary |
| `--secondary` | `#F5F5F6` | Superfície secundária |
| `--secondary-foreground` | `#111114` | Texto em secondary |
| `--muted` | `#FAFAFA` | Fundo sutil |
| `--muted-foreground` | `#4A4A52` | Texto secundário |
| `--accent` | `#F5F5F6` | Hover e estado repouso |
| `--accent-foreground` | `#111114` | Texto em accent |
| `--destructive` | `#B42318` | Erro/destrutivo |
| `--border` | `#E2E2E5` | Bordas |
| `--input` | `#E2E2E5` | Campos |
| `--ring` | `#185EFF` | Foco visível |

### Tokens semânticos, dark

| Token | Valor atual | Uso |
| --- | --- | --- |
| `--background` | `#0b0b0b` | Canvas principal |
| `--foreground` | `#FAFAFA` | Texto primário |
| `--card` | `#181818` | Superfície de card |
| `--popover` | `#111114` | Menus e overlays |
| `--primary` | `#185EFF` | Ação primária |
| `--secondary` | `#1C1C20` | Superfície secundária |
| `--muted` | `#1C1C20` | Fundo sutil |
| `--muted-foreground` | `#9C9CA3` | Texto secundário |
| `--accent` | `#1C1C20` | Hover e seleção leve |
| `--destructive` | `#E5564C` | Erro/destrutivo |
| `--border` | `#2a2a2a` | Bordas |
| `--input` | `#1C1C20` | Campos |
| `--ring` | `#185EFF` | Foco visível |

### Sidebar

Light:

- `--sidebar: #FAFAFA`
- `--sidebar-foreground: #111114`
- `--sidebar-primary: #185EFF`
- `--sidebar-accent: #EEEEF0`
- `--sidebar-border: #E2E2E5`

Dark:

- `--sidebar: #0b0b0b`
- `--sidebar-foreground: #FAFAFA`
- `--sidebar-primary: #185EFF`
- `--sidebar-accent: #1C1C20`
- `--sidebar-border: #1C1C20`

### Estados e dados

| Token | Light | Dark | Uso |
| --- | --- | --- | --- |
| `--chart-positive` | `#117A4D` | `#2BB673` | Tendência positiva, sucesso analítico |
| `--chart-negative` | `#B42318` | `#E5564C` | Tendência negativa, erro analítico |
| `--chart-1` | `#0F62FE` | `#0F62FE` | Série principal |
| `--chart-2` | `#0072C3` | `#0072C3` | Série secundária |
| `--chart-3` | `#007D79` | `#007D79` | Série terciária |
| `--chart-4` | `#697077` | `#697077` | Neutro frio |
| `--chart-5` | `#726E6E` | `#726E6E` | Neutro quente |

No Maturidade, não usar verde/vermelho para maturidade. Score deve ser comunicado por posição, tamanho, número e famílias fixas por camada.

Camadas atuais:

- Fundador/Diretoria: família `--omdx-layer-diretoria-*`.
- Liderança: família `--omdx-layer-lideranca-*`.
- Operação/Time: família `--omdx-layer-time-*`.
- Dimensões: famílias neutras `cool-gray`, `gray`, `warm-gray`.

## Gradiente de marca para site e auth

Existe um efeito de gradiente animado em `gradient-transfer/` e no auth visual do app. Use como superfície especial, não como padrão de dashboard.

Tokens do gradiente atual:

```css
--gradient-color-1: #7e1aff;
--gradient-color-2: #ade517;
--gradient-color-3: #7e1aff;
--gradient-color-4: #ade517;
```

Uso recomendado:

- Hero de site, login, campanha ou superfície institucional.
- Sempre com contraste validado para texto.
- Respeitar `prefers-reduced-motion`.
- Não usar como fundo de card operacional, tabela ou dashboard.

## Tipografia

### Famílias

| Token | Fonte atual | Uso |
| --- | --- | --- |
| `--font-sans` | Inter | UI, body, dashboards, tabelas, botões |
| `--font-heading` | Inter | Títulos de produto |
| `--font-serif` | Instrument Serif | Ênfase editorial rara, preferencialmente marketing |
| `--font-mono` | JetBrains Mono | Código, ids, valores técnicos |
| `--font-figma-heading` | Plus Jakarta Sans | Paridade com telas de auth vindas do Figma |
| `--font-figma-copy` | Instrument Sans | Paridade com telas de auth vindas do Figma |
| `--font-figma-flex` | Roboto Flex | Paridade pontual de layouts importados |

Recomendação para novas superfícies:

- Produto/app: Inter para quase tudo.
- Site/marketing: Instrument Sans ou Inter para corpo; Instrument Serif apenas para uma camada editorial clara.
- Monospace: JetBrains Mono para código e metadados técnicos.
- Não usar serif em labels, botões, tabelas ou formulários.

### Escala de texto

Use escala fixa, sem fonte fluida em interfaces de produto.

| Papel | Classe/valor atual | Peso | Uso |
| --- | --- | --- | --- |
| Micro label | `text-xs` (12px) | 500 | Badges, labels auxiliares |
| Controle compacto | `text-[0.8rem]` (12.8px) | 500 | Botões pequenos, filtros |
| Corpo denso | `text-sm` (14px) | 400/500 | Tabelas, labels, descrições |
| Corpo padrão | `text-base` (16px) | 400/500 | Texto de formulário e conteúdo |
| Título de painel | `text-base` (16px) | 600 | Dialogs, cards, seções compactas |
| Título público compacto | `text-xl` (20px) | 600 | Formulários públicos estreitos |
| Título de página | `text-2xl` (24px) | 600 | Workspace, páginas autenticadas |
| KPI | `text-3xl` (30px) | 600 | Números principais |
| Auth/marketing | `40px` | 600 | Login e superfícies públicas específicas |

Regras:

- Letter spacing sempre normal, não negativo.
- Números alinháveis usam `tabular-nums`.
- Body/prosa longa: máximo entre 65 e 75 caracteres por linha.
- Tabelas e dashboards podem ser mais densos.
- Pesos principais: 400, 500, 600. Peso 700 apenas quando PDF, material exportado ou hierarquia exigir.

## Espaçamento e layout

Base: grade mental de 4px.

Padrões atuais:

- App shell autenticado: sidebar + topbar sticky de `h-16`, reduzindo para `h-12` com sidebar colapsada.
- Conteúdo autenticado: `px-6 py-8 lg:px-10`.
- Container documental: `mx-auto w-full max-w-6xl`.
- Conteúdo longo documental: coluna de leitura em torno de `760px`.
- Cards: `gap-4`, `py-4`, `px-4`; variante pequena com `gap-3`, `py-3`, `px-3`.
- Tabelas: wrapper próprio com overflow horizontal, não dentro de `Card`.

Regra:

- Não colocar card dentro de card.
- Não usar cards para enquadrar a página inteira.
- Tabela operacional deve ficar no fluxo da página, com header e ações livres, seguida por wrapper `overflow-hidden rounded-lg border`.
- Topbar recebe filtros globais via `actions`, não dentro do corpo principal.

## Border radius

Token base:

```css
--radius: 0.625rem; /* 10px */
```

Escala atual:

| Token | Valor aproximado | Uso |
| --- | --- | --- |
| `--radius-sm` | 6px | Elementos pequenos, detalhes |
| `--radius-md` | 8px | Itens de menu, tabs internas |
| `--radius-lg` | 10px | Cards, botões, inputs, popovers |
| `--radius-xl` | 14px | Superfícies especiais |
| `--radius-2xl` | 20px | Superfícies públicas específicas |
| `999px` / `rounded-full` | Pill | Badges, avatars, pills |

Componentes:

- Button: `rounded-lg`, com ajustes `min(var(--radius-md), 10px/12px)` em tamanhos pequenos.
- Card: `rounded-lg`.
- Input/Select: `rounded-lg`.
- Tabs list: `rounded-lg`; trigger: `rounded-md`.
- Dialog/Popover/Select content: `rounded-lg`.
- Badge/status: pill.

## Bordas, sombras e elevação

Padrão Directscal:

- Cards com borda de 1px ou `ring-1 ring-foreground/10`.
- Sem sombra por padrão.
- Sombras somente em popovers, menus, dialogs e elementos realmente elevados.
- Bordas usam `border`, `border-border`, `ring-foreground/10` ou tokens semânticos.

Evitar:

- Sombra colorida.
- Glassmorphism como padrão.
- Gradiente em texto.
- Side stripes grossas em cards.
- Ícones dentro de bolhas coloridas repetidas.

## Componentes base

### Button

Arquivo: `src/components/ui/button.tsx`.

Variantes:

- `default`: `bg-primary text-primary-foreground`.
- `outline`: borda neutra, hover `bg-muted`.
- `secondary`: superfície secundária.
- `ghost`: hover discreto.
- `destructive`: fundo destrutivo leve, texto destrutivo.
- `link`: texto primary com underline no hover.

Tamanhos:

- `xs`: 24px de altura.
- `sm`: 28px.
- `default`: 32px.
- `lg`: 36px.
- `icon`: 32px quadrado.
- `icon-xs`: 24px.
- `icon-sm`: 28px.
- `icon-lg`: 36px.

Regras:

- Use ícones Lucide quando o comando for reconhecível.
- Ícone padrão: `size-4`; compacto: `size-3` ou `size-3.5`.
- Foco: `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`.
- Estado ativo pode deslocar `translate-y-px`.

### Card

Arquivo: `src/components/ui/card.tsx`.

Anatomia:

- `Card`: superfície.
- `CardHeader`: título, descrição e ação.
- `CardTitle`: `font-heading text-base leading-snug font-medium`.
- `CardDescription`: `text-sm text-muted-foreground`.
- `CardContent`: `px-4`.
- `CardFooter`: `border-t bg-muted/50 p-4`.

Uso:

- KPIs, blocos executivos, itens repetidos, modais ou ferramentas enquadradas.
- Não usar para tabela operacional principal.

### Badge e status

Arquivo base: `src/components/ui/badge.tsx`.

Badge padrão:

- Altura 20px.
- `text-xs font-medium`.
- Pill com borda transparente ou neutra.

Status Maturidade:

- Rascunho: `bg-muted text-muted-foreground border-border`.
- Ativo: `bg-primary/10 text-primary border-primary/20`.
- Encerrado: `bg-secondary text-foreground border-border`.

### Input e Select

Input:

- Altura 32px.
- `rounded-lg border-input bg-transparent`.
- Texto `text-base`, ajustando para `md:text-sm`.
- Placeholder em `text-muted-foreground`.
- Estados `disabled` e `aria-invalid` já definidos.

Select:

- Usar sempre o primitive do sistema, não `<select>` nativo.
- Trigger com altura 36px, borda `border-input`, popup `bg-popover`, sombra discreta.
- Item com `data-highlighted:bg-accent`.

### Table

Arquivo: `src/components/ui/table.tsx`.

Padrão:

- `text-sm`.
- Header com `h-10 px-2 font-medium`.
- Cells com `p-2`.
- Row hover `hover:bg-muted/50`.
- Wrapper com `overflow-x-auto`.

Regras:

- Números usam `tabular-nums`.
- Tabelas operacionais ficam sem `Card` externo.
- Evitar colunas com texto longo sem truncamento ou wrap planejado.

### Tabs

Arquivo: `src/components/ui/tabs.tsx`.

Padrões:

- `TabsList` default: `bg-muted`, `rounded-lg`, altura 32px.
- `TabsTrigger`: `text-sm font-medium`, estado ativo `bg-background text-foreground`.
- Variante `line`: transparente com indicador de 2px.

Uso:

- Filtros locais e seções internas.
- Não usar como navegação principal entre módulos quando sidebar já existe.

### Dialog e Sheet

Dialog:

- Confirmações, decisões curtas e estados bloqueantes.
- `max-w-md`, `rounded-lg`, `border`, `bg-popover`, `shadow-lg`.
- Duração 150ms, sem coreografia.

Sheet:

- Drawers laterais de criação/configuração.
- No Maturidade, criar/configurar diagnóstico acontece no drawer, não em página própria.

### Sidebar e Topbar

Sidebar:

- Base shadcn `sidebar-07`, adaptada para Directscal.
- Collapsible para ícones.
- Navegação principal do cliente plana, sem o título de seção `Módulos` e sem subitens expansíveis.
- `Maturidade`, `Camadas`, `Diagnósticos`, `Cronograma` e as seis dimensões ficam no mesmo nível.
- A sidebar não exibe a seção `Recursos` nem o item `Documentação`; `/docs` permanece como rota acessível diretamente.
- Em admin, a navegação troca para a seção `Administração`.
- `SidebarMenuButton` usa `render={<Link />}`, não `asChild`.

Topbar:

- Sticky, altura 64px.
- Fundo `bg-sidebar/95` com blur quando suportado.
- Conteúdo: trigger da sidebar, separador, breadcrumb e ações contextuais.
- Não adicionar busca/notificações/filtros globais sem decisão explícita.

### KPI card

Padrão atual:

- Label: `text-sm font-normal text-muted-foreground`.
- Valor: `text-3xl font-semibold tracking-tight tabular-nums`.
- Trend: pill discreto com borda, `text-xs font-medium`, ícone Lucide `size-3`.
- Tendências usam `--chart-positive`, `--chart-negative` ou `text-muted-foreground`.

## Iconografia

- Biblioteca padrão: Lucide.
- Tamanho base: `size-4` (16px).
- Tamanhos compactos: `size-3`, `size-3.5`.
- Tamanho maior: `size-5` apenas quando a densidade permitir.
- Stroke padrão da biblioteca.
- Ação sem texto visível precisa de `aria-label`.

## Motion

Produto:

- Duração padrão: 120ms a 180ms.
- Limite prático: 280ms.
- Motion deve comunicar estado: hover, active, abertura, fechamento, loading, reveal.
- Sem bounce, spring, elastic ou page-load choreography.
- Não animar propriedades de layout quando transform/opacity resolve.

Gradientes e vídeos:

- Apenas em superfícies públicas ou de auth.
- Respeitar `prefers-reduced-motion`.
- Não bloquear leitura, foco ou interação.

## Acessibilidade

Obrigatório:

- Contraste WCAG AA.
- Foco visível com ring de marca.
- Semântica HTML: `<button>` para ação, `<a>` para navegação, `<table>` para dado tabular.
- `aria-label` em botões de ícone.
- Estados `disabled`, `loading`, `empty` e `error` quando o componente depender de dados.
- Skeleton localizado no lugar de spinner central.

## Modo claro e escuro

O app usa `next-themes`, atributo `class` em `<html>`, default `system`. Ao criar novas superfícies:

- Declarar novos tokens em `@theme inline`, `:root` e `.dark`.
- Não congelar cor com `useMemo(..., [])` se a cor vier de CSS variable e precisa reagir ao tema.
- ECharts deve usar `useChartThemeColors()` para recalcular cores na troca de tema.

## Guia para site e aplicações

Para manter site e apps parecidos, todos devem compartilhar os mesmos papéis semânticos, mesmo que a stack mude.

### CSS mínimo para site estático

```css
:root {
  --ds-brand-50: #F4F7FF;
  --ds-brand-100: #E6EDFF;
  --ds-brand-500: #185EFF;
  --ds-brand-600: #1450DB;
  --ds-brand-700: #0F3FAE;

  --ds-background: #FFFFFF;
  --ds-foreground: #111114;
  --ds-muted: #FAFAFA;
  --ds-muted-foreground: #4A4A52;
  --ds-border: #E2E2E5;
  --ds-primary: var(--ds-brand-500);
  --ds-primary-foreground: #FFFFFF;

  --ds-font-sans: "Inter", "Instrument Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --ds-font-serif: "Instrument Serif", Georgia, serif;
  --ds-font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --ds-radius-sm: 6px;
  --ds-radius-md: 8px;
  --ds-radius-lg: 10px;
  --ds-radius-xl: 14px;
  --ds-radius-2xl: 20px;
}
```

### Mapeamento para Tailwind/shadcn

| Design system | App Tailwind atual |
| --- | --- |
| Canvas | `bg-background text-foreground` |
| Card | `bg-card text-card-foreground rounded-lg ring-1 ring-foreground/10` |
| Borda | `border border-border` |
| Texto secundário | `text-muted-foreground` |
| CTA primário | `bg-primary text-primary-foreground` |
| Hover neutro | `hover:bg-muted hover:text-foreground` |
| Foco | `focus-visible:ring-3 focus-visible:ring-ring/50` |
| Números | `tabular-nums` |

## Checklist para outra IA

Antes de criar ou alterar interface:

1. Ler `AGENTS.md` e o `CLAUDE.md` da pasta mais próxima.
2. Usar `src/app/globals.css` como fonte de tokens.
3. Usar primitives de `src/components/ui/` antes de criar componentes novos.
4. Em base-ui, usar `render={<Componente />}` no lugar de `asChild`.
5. Manter texto em pt-BR, sentence case, sem emoji e sem ponto de exclamação.
6. Usar `cn()` para compor classes.
7. Usar Lucide para ícones.
8. Evitar hex literal fora de tokens, assets e PDF.
9. Validar light e dark.
10. Validar mobile quando a superfície for pública.

## Anti-padrões

Não fazer:

- Blue-to-purple gradient genérico em dashboard.
- Card grid idêntico com ícone colorido, título e texto repetido.
- Tabela operacional dentro de card.
- Texto todo em caixa alta como padrão.
- `text-transform: uppercase` por estilo global.
- Serif em labels, botões ou dados.
- Sombra em cards comuns.
- `asChild` em primitives base-ui.
- `<select>` nativo em tela nova.
- Gradiente em texto.
- Animação com bounce/spring.
- Cor como único canal para comunicar dado.

## Exemplo de componente alinhado

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExampleMetricCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          Maturidade geral
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          72
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          Operação em atenção
        </p>
        <Button className="mt-4">Ver diagnóstico</Button>
      </CardContent>
    </Card>
  );
}
```

## Manutenção

Atualize este documento quando mudar:

- Cor, fonte, raio, spacing ou token global.
- Biblioteca de primitives.
- Padrão de componente compartilhado.
- Regra de dark mode.
- Voz e terminologia do produto.

Quando houver divergência, a ordem de decisão é:

1. `src/app/globals.css`.
2. `src/components/ui/`.
3. `src/components/CLAUDE.md` e docs locais.
4. Este documento.
5. Implementações antigas.
