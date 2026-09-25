# Referência de tema Webflow para o App DirectScal

Estudo visual e técnico do projeto Webflow `DirectScal`, realizado em 4 de setembro de 2026 no Designer autenticado e na prévia interativa.

Fonte observada: `https://directscal-bcb540.design.webflow.com/`

## Objetivo

Extrair o que torna os modos claro e escuro do projeto consistentes e agradáveis, principalmente em inputs, botões, cards, navegação e transições, e traduzir essas decisões para o produto DirectScal sem copiar a escala de uma landing page nem abandonar os tokens e primitives atuais do app.

## Conclusão executiva

O principal acerto do projeto não é uma paleta extensa. É a separação entre papéis semânticos e contexto de uso.

O sistema parte de quatro superfícies:

1. `bgPrimary`: fundo principal claro.
2. `bgSecondary`: fundo claro de segundo nível.
3. `bgAccent`: ação ou superfície de destaque.
4. `bgInverse`: superfície escura.

Componentes não recebem cores isoladas por tela. Eles têm variantes para o contexto em que aparecem, como `on-inverse`, `on-accent-primary` e `is-secondary`. Isso permite que a mesma anatomia funcione sobre branco, azul-claro ou azul-marinho.

Para o App DirectScal, vale adotar essa lógica de contexto e interação. Não vale copiar literalmente tamanhos de marketing, o ciano da referência ou cards brancos em massa dentro do dark mode.

## Evidência observada

### Paleta-base

| Papel no Webflow | Valor | Uso observado |
| --- | --- | --- |
| Neutral primary | `#FFFFFF` | Canvas e cards claros |
| Neutral secondary | `#F6F7F9` | Superfície clara secundária |
| Neutral inverse | `#00001F` | Seções escuras e texto no claro |
| Accent primary | `#5AC1FF` | CTA, links e controle ativo |
| Accent hover | `#97D8FF` | Hover do CTA |

O azul-marinho quase preto evita o preto puro e dá identidade ao dark. No claro, esse mesmo valor é usado como texto principal. A consistência vem da inversão de papéis, não de novas cores.

### Transparências semânticas

| Contexto | Valor observado |
| --- | --- |
| Texto secundário no claro | `rgba(0, 0, 31, 0.60)` |
| Texto secundário no escuro | `rgba(255, 255, 255, 0.60)` |
| Borda primária no claro | `rgba(0, 0, 31, 0.10)` |
| Borda secundária no claro | `rgba(0, 0, 31, 0.20)` |
| Borda primária no escuro | `rgba(255, 255, 255, 0.20)` |
| Borda secundária no escuro | `rgba(255, 255, 255, 0.10)` |

Esse padrão produz profundidade por contraste relativo. O componente continua pertencendo à superfície, em vez de parecer uma peça de outra biblioteca.

### Contraste medido

| Par | Contraste aproximado | Leitura |
| --- | --- | --- |
| `#00001F` sobre `#FFFFFF` | `20.59:1` | Excelente |
| `#5AC1FF` sobre `#00001F` | `10.30:1` | Excelente |
| `#5AC1FF` sobre `#FFFFFF` | `2.00:1` | Insuficiente como único indicador de foco |
| `#97D8FF` sobre `#00001F` | `13.32:1` | Excelente |

O ciano funciona muito bem dentro do dark mode, mas o outline ciano observado sobre branco não atinge `3:1`. No App DirectScal, o ring `#185EFF` deve continuar sendo a referência de foco, ou o foco precisa combinar ring e borda de alto contraste.

## Modo claro

### Superfícies

- Canvas branco, sem tonalização decorativa.
- Segundo nível em `#F6F7F9`.
- Texto principal em azul-marinho quase preto.
- Bordas formadas por 10% ou 20% do próprio foreground.
- Sombras não são usadas para separar os componentes principais.

### Botão primário

Valores medidos na landing page:

- Fundo `#5AC1FF`.
- Texto `#00001F`.
- Borda transparente de `1px` para evitar mudança geométrica entre estados.
- Raio `8px`.
- Padding `16px 24px`.
- Altura renderizada próxima de `53px`.
- Tipografia `16px / 19.2px`, peso 400.
- Transição somente de `border-color`, `color` e `background-color`.
- Hover em `#97D8FF`.
- Foco com outline de `2px`, offset de `2px`.

O botão parece responsivo porque o estado muda sem alterar tamanho, sombra ou posição. A geometria permanece estável.

### Botão secundário

- Fundo e borda transparentes.
- Texto recebe a cor de link/acento.
- Mantém o mesmo box do botão primário.
- Em superfícies inversas, usa branco a 20% no repouso e 30% no hover.

### Input

Valores medidos:

- Fundo transparente.
- Borda de `1px` usando o foreground.
- Raio `8px`.
- Padding `16px`.
- Altura renderizada próxima de `55px`.
- Texto `16px`, line-height `1.3`.
- Placeholder com baixa opacidade do foreground.
- Transição de `background-color` e `border-color` em `200ms`.
- Curva `cubic-bezier(0.165, 0.84, 0.44, 1)`.
- Foco com outline de `2px` e offset de `2px`.

O foco preserva a borda interna escura e adiciona um halo externo. Essa dupla camada é mais clara do que trocar apenas a cor da borda.

## Modo escuro

### Superfície inversa

- Canvas `#00001F`.
- Texto principal branco.
- Texto secundário branco a 60%.
- Bordas em branco a 10% ou 20%.
- Imagens recebem overlay escuro para manter texto branco legível.

O dark mode tem baixo ruído porque o fundo principal é uniforme. A profundidade aparece por borda, imagem e transparência, não por vários tons de card competindo entre si.

### Botões sobre fundo escuro

Primário contextual observado:

- Fundo branco a 90%.
- Texto `#00001F`.
- Hover em branco sólido.
- Mesma anatomia e mesma transição do botão claro.

Secundário contextual observado:

- Fundo branco a 20%.
- Texto branco.
- Hover em branco a 30%.

Essa lógica é transferível: o componente conhece o contexto da superfície. Não depende de classes ocasionais como `dark:text-white` distribuídas pelas páginas.

### Cards em seção escura

A referência usa cards brancos sobre canvas `#00001F`, com raio `12px` e borda sutil. O contraste é propositalmente alto e funciona na composição editorial da landing page.

No produto, isso deve ser reservado para um painel de decisão, empty state ou bloco destacado. Em dashboards densos, cards brancos dentro do dark mode criariam flashes visuais e quebrariam a continuidade do trabalho.

## Motion e microinterações

### Curvas e propriedades

- Botões: `300ms`, com ease-out forte no fundo.
- Inputs: `200ms`, ease-out-quart.
- Accordion: `max-height 300ms` com `cubic-bezier(0.645, 0.045, 0.355, 1)`.
- Cards animados: `opacity` e `transform`, sem animar largura ou altura diretamente.
- Navegação: hover por mistura de `currentColor` a 5%, 10% ou 20%, de acordo com o contexto.

### O que aplicar no produto

- Transicionar somente propriedades que comunicam estado.
- Manter geometria, borda e alinhamento estáveis entre repouso, hover e foco.
- Usar `currentColor` com transparência para hover neutro e contextual.
- No app, reduzir a duração para `120–180ms`; os `300ms` da landing page são agradáveis em marketing, mas lentos para uso operacional repetitivo.
- Respeitar `prefers-reduced-motion` e remover transformações não essenciais.

## O que não copiar

### Escala de marketing

Botões de `53px`, inputs de `55px`, títulos com quase `90px` e padding de card de `32px` funcionam na landing page, mas reduziriam a densidade do app. O produto deve manter controles de `32–36px`, com exceções deliberadas para auth e formulários públicos.

### Cor de marca

O ciano `#5AC1FF` é a cor de acento do template observado, não a cor principal DirectScal. O app já usa `#185EFF` como sinal de ação, seleção e foco. A recomendação é importar a arquitetura de estados, não substituir a identidade da marca.

### Problema observado no accordion escuro

Na prévia interativa, os títulos das perguntas ficaram praticamente invisíveis: o toggle calculou `color: #00001F` sobre a seção `#00001F`. Apenas respostas e divisores apareceram com clareza.

Isso demonstra o risco de depender de herança em componentes interativos. Cada variant contextual precisa definir explicitamente foreground, muted foreground, borda, hover e foco.

### Foco ciano no claro

O outline `#5AC1FF` tem contraste aproximado de `2:1` contra branco. Não deve ser usado sozinho como indicador de foco. O padrão atual do App DirectScal, com brand blue e ring mais forte, é mais seguro.

### Algumas decisões inconsistentes

- Botões usam `Instrument Sans`, mas parte da navegação e de componentes medidos caiu em Arial no canvas do Designer.
- Há regras de animação de card com curva elástica em partes do template. Elas não combinam com o registro operacional do produto.
- Tags em caixa alta fazem sentido no estilo editorial do template, mas não devem virar padrão no app.

## Tradução para o App DirectScal

### Princípio de implementação

O app deve continuar usando tokens semânticos e primitives compartilhados. A mudança proposta é ampliar a clareza dos estados, não criar um segundo design system.

| Ideia da referência | Aplicação no app |
| --- | --- |
| `bgPrimary` | `--background` |
| `bgSecondary` | `--secondary` ou `--muted` |
| `bgInverse` | `--foreground` no claro; canvas dark por token próprio |
| Texto principal | `--foreground` |
| Texto secundário | `--muted-foreground` |
| Borda por transparência | `--border` derivado do foreground da superfície |
| Accent primary | `--primary` atual `#185EFF` |
| Variant `on-inverse` | Variantes semânticas de Button/Input/Card, sem classes locais de cor |
| Hover por `currentColor` | `color-mix()` ou tokens `--accent`/`--muted` |

### Recomendação para light

- Manter canvas e card claros.
- Manter texto quase preto e bordas discretas.
- Dar mais definição ao hover por alteração pequena de fundo, sem sombra.
- Inputs devem preservar a borda no foco e receber ring externo.
- Botões devem transicionar cor e fundo, não `all`.

### Recomendação para dark

- Tratar o dark como uma composição própria, não como inversão automática.
- Manter uma diferença discreta entre canvas, sidebar, card e popover.
- Usar texto secundário entre 60% e 70% de branco, conforme o contraste real.
- Usar bordas entre 10% e 20% de branco, conforme elevação.
- Reservar superfícies claras dentro do dark para decisões ou destaques especiais.
- Garantir variantes explícitas para controles que aparecem em fundos diferentes.

### Primitives a revisar na futura implementação

1. `src/components/ui/button.tsx`
   - Trocar `transition-all` por propriedades específicas.
   - Preservar os tamanhos compactos e o formato pill já adotado no app.
   - Verificar hover, active, focus, disabled, loading e `aria-expanded` nos dois temas.
2. `src/components/ui/input.tsx`
   - Preservar borda interna no foco.
   - Ajustar a transição para `border-color`, `background-color` e, se necessário, `box-shadow`.
   - Validar placeholder, disabled, invalid e autofill em light/dark.
3. `src/components/ui/select.tsx`
   - Usar a mesma gramática visual do input.
   - Validar trigger, popup, highlighted, selected, disabled e teclado.
4. `src/components/ui/card.tsx`
   - Manter cards escuros dentro do dark mode por padrão.
   - Criar superfície inversa apenas se houver uso real, não preventivamente.
5. `src/app/globals.css`
   - Consolidar níveis de superfície e borda.
   - Evitar hex em componentes.
   - Não alterar a paleta de gráficos OMDX ao ajustar os neutros da interface.

## Sequência recomendada de aplicação

### Fase 1: tokens e estados

- Definir uma matriz de superfície para light e dark: canvas, sidebar, card, popover, muted e border.
- Definir a matriz de estado: hover, focus, active, disabled, invalid e selected.
- Validar contraste antes de mudar os primitives.

### Fase 2: primitives

- Aplicar primeiro em Button, Input e Select.
- Usar uma página de teste com todos os estados lado a lado.
- Remover overrides locais somente quando forem equivalentes ao novo primitive.

### Fase 3: superfícies reais

- Validar `/perfil`, `/configuracoes` e o drawer de diagnóstico.
- Validar menu, select, dialog e tabela em light/dark.
- Conferir dashboard com gráficos para evitar alteração acidental de paleta analítica.

### Fase 4: refinamento

- Ajustar durações dentro de `120–180ms`.
- Testar teclado, foco visível, redução de movimento e estados inválidos.
- Verificar desktop e 375px, inclusive popups e overflow horizontal.

## Critérios de aceite

- Troca de tema não produz flash branco, texto invisível ou card fora de contexto.
- Todos os controles têm default, hover, focus, active, disabled e invalid quando aplicável.
- Foco visível atinge contraste mínimo de `3:1` contra cores adjacentes.
- Botões e inputs não mudam de tamanho entre estados.
- Nenhum componente usa `transition-all` sem justificativa.
- Cards comuns continuam sem sombra.
- Popovers, dialogs e menus usam elevação discreta e consistente.
- Não há hex literal nos componentes.
- Light e dark foram verificados visualmente em desktop.
- Formulários públicos foram verificados também em 375px.
- `prefers-reduced-motion` foi respeitado.

## Decisão recomendada

Adotar a gramática de interação do Webflow e manter a identidade DirectScal:

- arquitetura semântica por superfície;
- variantes contextuais explícitas;
- foco em duas camadas, borda mais ring;
- hover por mudança de cor/fundo, sem salto ou sombra;
- dark mode profundo e contínuo;
- brand blue atual como cor de ação;
- densidade e tamanhos atuais do produto.

Essa combinação entrega a sensação refinada da referência sem transformar o app em uma landing page nem introduzir inconsistências com o design system existente.
