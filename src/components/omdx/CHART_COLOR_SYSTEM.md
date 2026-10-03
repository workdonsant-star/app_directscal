# Sistema de cores dos charts

Este documento governa as cores dos cinco SVGs manuais da página `/omdx`.

## Modelo de tokens

Cada papel visual possui um único nome de token. O mesmo token é declarado em `:root` e `.dark`; por isso, o componente não escolhe uma cor por tema e não precisa reagir ao switch com JavaScript.

Valores iguais não tornam dois tokens redundantes quando representam espaços diferentes do sistema e podem evoluir separadamente. A mesma regra vale para tipografia: estilos podem coincidir hoje em tamanho e line-height e continuar separados por função.

## Aplicação na Overview

- **Maturidade por camada:** Fundador usa `--overview-chart-founder`, Liderança usa `--overview-chart-leadership` e Tático usa `--overview-chart-tactical`. Cada token resolve para o seu equivalente light/dark.
- **Dimensões gerenciais:** a série consolidada usa `--overview-chart-dimensions`; as dimensões são distinguidas por posição e label.
- **Dimensões por camadas:** reutiliza os três tokens de camada do chart horizontal. Labels internos, ordem da pilha e tooltip preservam a identificação de cada camada.
- **Vulnerabilidades por pergunta:** usa a escala roxa `--overview-matrix-vulnerability-*`; scores baixos permanecem visualmente mais densos e cada célula mostra classificação e média.
- **Alavancas prioritárias:** usa a escala verde `--overview-matrix-leverage-*`; cada célula mostra o nível e o índice convertido para a escala visual de 0 a 5.
- **Uso dos processos:** `--overview-chart-usage-resolved` (violeta) marca perguntas respondidas com fonte e consultas; `--overview-chart-usage-gap` (laranja) marca perguntas sem resposta publicada e respostas avaliadas como não úteis. O par foi validado pelo `validate_palette.js` da skill de dataviz nos dois temas (faixa de luminosidade, croma, separação para daltonismo e contraste 3:1 sobre `--surface-sidebar`). Legenda e números diretos acompanham as duas séries.
- **Histórico:** fica disponível no título acessível de cada marca SVG quando existe base comparável; não cria uma segunda família cromática nem altera a geometria aprovada.

## Regras

- Não expandir o mapeamento cromático específico da Overview para outras visualizações sem uma decisão explícita.
- Não usar vermelho, amarelo ou verde sem semântica documentada.
- Não escrever HEX em componentes. Valores de cor ficam exclusivamente em `globals.css`.
- Escalas contínuas usam uma família semântica e contexto neutro, sem arco-íris.
- Labels, posição, forma e títulos acessíveis das marcas SVG devem manter o chart compreensível sem depender exclusivamente de cor.

Este teste não migra automaticamente os charts de Insights, relatórios ou outras rotas. Eles continuam sob o contrato anterior até uma decisão explícita de expansão.
