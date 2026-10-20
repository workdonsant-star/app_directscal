# Sistema de cores dos dados

Este documento governa as cores de charts, matrizes, cards de KPI e indicadores de status do app. A fonte é a paleta do Figma DirectScal App (arquivo `oApRszoNt9EgWVZbF8C7wN`, nó `285:2`): nove famílias (Purple, Teal, Lime, Mint, Blue, Grey, White, Red, Orange) com sete tons cada (50, 75, 100, 200, 300, 400, 500).

## Regra central

**Mesmo dado, mesma cor. Dado diferente, cor diferente.** Duas medidas que parecem parecidas, mas medem coisas distintas, nunca compartilham a mesma cor. Exemplo que motivou a regra: no uso do agente, "Consultas" e "Avaliadas como não úteis" repetiam as cores de "Respondidas com fonte" e "Sem resposta publicada". Agora cada uma dessas quatro medidas tem uma cor própria.

## Camadas de tokens

1. **Primitivos** `--palette-{família}-{tom}` em `:root`, iguais nos dois temas. Componentes nunca usam esses nomes diretamente.
2. **Semânticos** (`--overview-chart-*`, `--overview-matrix-*`, `--overview-scale-*`, `--omdx-status-*`, `--chart-*`, `--ap-*`), declarados em `:root` e `.dark` em `src/app/globals.css`. Cada tema escolhe o tom da mesma família, e o componente não precisa saber qual é o tema.

Hex nunca vai para componentes. As únicas exceções são os mapas de fallback dos charts ECharts (`useChartThemeColors`), que repetem o valor do tema claro até as variáveis CSS serem lidas.

## Uma família por significado

Em 18/10/2026 a saturação desceu um degrau: as séries usam os tons mais suaves de cada família (100 e 75 no lugar de 200 e 300). Tons mais suaves têm menos contraste, por isso charts com séries nesses tons mantêm o valor escrito ou o tooltip. Teal (camadas) e Lime 500 (progresso) já eram contidos e não mudaram.

| Significado | Família | Tokens | Claro | Escuro |
| --- | --- | --- | --- | --- |
| Camadas (Fundador, Liderança, Operação) | Teal, rampa ordinal | `--overview-chart-founder` / `-leadership` / `-tactical` | 300 / 200 / 100 | 75 / 100 / 200 |
| Maturidade: nota da pesquisa, dimensões | Purple | `--overview-chart-dimensions` | 100 | 100 |
| Estimativa do agente (forma vazada e tracejada) | Purple | `--overview-chart-estimate` | 75 | 75 |
| Progresso pelas ações | Lime | `--overview-chart-progress` | 500 | 400 |
| Agente: respondidas com fonte | Blue | `--overview-chart-usage-resolved` | 100 | 100 |
| Agente: sem resposta publicada | Orange | `--overview-chart-usage-gap` | 400 | 400 |
| Agente: consultas por processo | Mint | `--overview-chart-usage-queries` | 500 | 400 |
| Agente: avaliadas como não úteis | Red | `--overview-chart-usage-not-useful` | 75 | 75 |
| Vulnerabilidades (sequencial) | Purple | `--overview-matrix-vulnerability-*` | 500, 100, 75, 50 | 500, 400, 200, 100 |
| Alavancas (sequencial) | Lime | `--overview-matrix-leverage-*` | 50 → 200 | 500, 400, 100, 75 |
| Nota de 1 a 5 em heatmap (sequencial) | Purple | `--overview-scale-score-*` | 50 → 100 | 500, 400, 200 |
| Variação positiva e negativa (texto) | Teal e Red / Lime e Red | `--chart-positive`, `--chart-negative` | teal 300, red 400 | lime 400, red 100 |

Camadas são **ordinais**: trocar Fundador e Operação muda o sentido, por isso usam uma rampa de uma família só, com Fundador no tom mais denso. No escuro a âncora inverte e Fundador fica no tom mais claro. Cada camada tem um token de rótulo (`--overview-chart-*-label`) que garante contraste do número escrito dentro da barra.

## Status é reservado

| Status | Claro | Escuro |
| --- | --- | --- |
| Consistente | Blue 100 | Blue 100 |
| Atenção | Orange 100 | Orange 100 |
| Inconsistente | Red 100 | Red 100 |
| Crítico | Red 500 | Red 200 |

A ordem segue a severidade do domínio (Consistente, Atenção, Inconsistente, Crítico). A cor de status aparece só no ponto, no anel ou na célula, sempre acompanhada do rótulo. **O texto do rótulo usa `text-foreground`, nunca a cor do status.** Atenção e Inconsistente ficam abaixo de 3:1 sobre a superfície clara de propósito, e o rótulo compensa isso. Variação percentual em cards usa `--chart-positive` e `--chart-negative`, que têm contraste de texto, e não as cores de status.

## Slots categóricos genéricos

`--chart-1` a `--chart-5` servem a charts com séries sem significado próprio (por exemplo, o benchmark do relatório). A ordem é fixa: Purple 100, Lime 500 (Lime 400 no escuro), Blue 100, Orange 400 e Red 100. Atribua em sequência e nunca recicle. Uma sexta série vira "Outros" ou um gráfico separado.

## Validação

Pares que ficam lado a lado no mesmo chart foram validados com o `validate_palette.js` da skill de dataviz. O teste cobre faixa de luminosidade, croma, separação para daltonismo (protan e deutan ≥ 8) e visão normal (ΔE ≥ 15), nos dois temas, sobre `--surface-card`.

- Nota mais progresso: passa. No escuro, os tons 100 ficam um pouco acima da faixa de luminosidade do validador, uma consequência aceita da saturação menor; o contraste segue acima de 6:1.
- Respondidas mais sem resposta: passa nos dois temas. Consultas (Mint) mais não úteis (Red 75): passa em visão normal; para daltonismo fica na faixa de 6 a 8 no escuro, permitida porque o chart mostra os números ao lado.
- Slots 1 a 5: passam nos dois temas. Purple 100, Blue 100 e Red 100 ficam abaixo de 3:1 no claro e dependem do valor visível, que os charts do relatório já mostram.
- Camadas: passam no teste ordinal (luminosidade monotônica, ΔL ≥ 0,06, tom claro ≥ 2:1).

Limites conhecidos da paleta:

- Teal e Mint têm croma baixo (< 0,10). Mint aparece só como consultas, sempre acompanhada de números; nenhum dos dois serve para séries categóricas sem rótulo. Por isso as três camadas não usam os três verdes do Figma: Lime contra Mint fica em ΔE 7,3 e reprova no teste de visão normal.
- A paleta tem cinco famílias saturadas e o app tem mais medidas do que isso. Por isso algumas medidas de seções diferentes usam tons distintos da mesma família, como nota (Purple 100) e estimativa (Purple 75), que também se distinguem pela forma. Dentro de um mesmo chart, duas séries nunca dividem a mesma família.

## Regras

- Não usar vermelho, laranja ou verde fora dos significados acima.
- Não escrever hex em componentes. Valores de cor ficam em `globals.css`.
- Escalas contínuas usam uma família, do claro ao denso, sem arco-íris.
- Rótulos, posição, forma e títulos acessíveis mantêm cada chart legível sem depender só da cor.
- Uma medida nova ganha um token semântico novo. Nunca reaproveite o token de outra medida porque a cor "combina".
