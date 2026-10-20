# Analytics: impacto dos ativos e dos action points

Decisão de produto de 18/10/2026. Implementação visual com dados ilustrativos; backend pendente.

## Pergunta de negócio

O cliente compra a nota subindo e a operação funcionando, não SOPs nem action points. O impacto é medido por uma cadeia em que todos os elos falam da mesma unidade, a pergunta crítica do diagnóstico:

```
Gap (pergunta/dimensão) → Action point → Ativo publicado → Uso do ativo → Nova leitura da mesma pergunta
```

| Camada | Pergunta do cliente | Indicador | Horizonte |
| --- | --- | --- | --- |
| Execução | A gente fez? | Saúde dos action points, check-ins | Semanas |
| Adoção | O time usa o que foi criado? | Adoção, cobertura e utilidade do ativo | Semanas |
| Resultado | Melhorou? | Variação da nota nas perguntas vinculadas | Meses |

## Estimativa entre coletas pelo agente

Coletas são marcos fechados e custam tempo de quem responde; não há coletas intermediárias. Entre uma coleta e outra, o agente da Directscal estima a nota das perguntas vinculadas, na mesma dinâmica do acompanhamento dos action points no Slack:

1. Cada action point herda as perguntas que o originaram e a nota por camada da última coleta (linha de base).
2. O agente conversa com o responsável (execução e indicador de sucesso) e com quem sente o problema no setor afetado (percepção). Perguntar só ao executor enviesaria a leitura.
3. A pergunta é sobre comportamento ("na última vez que…"), não opinião. O relato é classificado na escala 1–5 da pergunta original por uma rubrica com âncoras, e a evidência fica guardada.
4. Execução, percepção e uso do ativo compõem uma nota estimada com nível de confiança. Ela nunca substitui a coleta.
5. A coleta seguinte calibra o agente: a diferença entre estimativa e nota real ajusta a rubrica.

Comparar perguntas tratadas com as demais é o argumento de impacto: "impacto observado", não causalidade.

## Cuidados

- Anonimato: só agregados por camada, mínimo de cerca de 3 pessoas; nenhum trecho com nome chega ao cliente.
- Transparência e LGPD: as pessoas sabem que o agente pode perguntar e para quê.
- Cansaço: no máximo uma pergunta por pessoa a cada 2–3 semanas, com rotação e sem cobrança.
- Viés do classificador: rubrica por pergunta; na primeira versão, revisão de um gestor Directscal antes de publicar.
- Interface: sem conversas do Slack nos charts; só números, com a estimativa identificada.

## O que está plotado hoje

`src/lib/data/omdx-impact-example.ts` parte das notas reais e plota: vínculo alavanca ↔ ativo, execução (pela demonstração de Action Points), uso do ativo, nota estimada, confiança, conversas, evolução em 30/60/90 dias e marcos. As três dimensões mais críticas são as alavancas tratadas; a primeira reage, a segunda executa sem efeito e a terceira não tem sinal.

## Dependências para dado real

- Vínculo action point ↔ `questionIds` e ativo ↔ action point.
- Snapshot da linha de base por pergunta e camada.
- Pertencimento ao setor para falar com o Time (hoje só lideranças por setor vêm do Slack).
- Agente que inicia conversa: agendador, `im:write` e reconexão do Slack (fase 3 de `experiencia-agentica-projetos-e-action-points.md`).
- Entidade de estimativa: pergunta, camada, valor, confiança, evidência e revisão.

## Critérios de aceite

Fase atual (implementada, dado ilustrativo):
- `/omdx` mostra os seis níveis na ordem acima, sem rótulo visível de nível, com notas, camadas, perguntas e aderência vindas dos dados reais.
- Todo dado plotado está identificado como ilustrativo e usa forma vazada e traço.
- Nenhum número é repetido em card isolado quando um chart já o mostra.

Fase de dado real (pendente):
- A estimativa de uma pergunta só aparece com mínimo de conversas por camada; abaixo disso, "sinal insuficiente".
- Cada estimativa guarda evidência e passa por revisão antes de chegar ao cliente.
- Após a coleta seguinte, o erro médio entre estimativa e nota real é calculado e exibido para a operação Directscal.


## Atualização de 20/10/2026

A10 implementa snapshot privado por pergunta/camada e vínculo ao acordo/ativo/versão; ver `resultado-com-evidencia.md`. A nota estimada, rubrica aprovada, coleta de percepção e calibração permanecem pendentes. O trecho anterior que sugere três pessoas é proposta histórica, não política vigente; conciliar com A16, cuja proposta atual é cinco. Dados ilustrativos ficam no exemplo explícito, sem representar evidência operacional real.
