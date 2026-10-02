# `src/lib/agent` — Agente de consulta dos ativos de gestão

Antes de editar, releia o **AGENTS.md**, `src/lib/CLAUDE.md` e `docs/ativos-de-gestao-e-agente-de-consulta.md`.

## Propósito

Responder perguntas do time do cliente usando somente ativos publicados da própria empresa, com fonte rastreável ou recusa explícita. O mesmo serviço atende `/assistente` (app) e o Slack.

## Fluxo

```text
Pergunta → embedding da pergunta (opcional) → busca híbrida filtrada pela organização
        → selectEvidence (limiar de relevância) → sem evidência: recusa sem chamar IA
        → provedor de IA com as fontes rotuladas (S1..Sn) → resolveGroundedAnswer
        → auditoria em asset_question_audits → resposta com citações
```

## Arquivos

- `config.ts` lê `ASSET_AGENT_PROVIDER`, `ASSET_AGENT_MODEL`, `ASSET_EMBEDDING_PROVIDER`, `ASSET_EMBEDDING_MODEL` e `OLLAMA_BASE_URL`. Sem configuração, o modo é `extractive` (trechos citados, sem IA) e a busca é só textual.
- `answer-policy.ts` é puro e testado: limiar de evidência, prompt do sistema, contrato JSON da resposta, mapeamento de rótulos para citações e modo extrativo.
- `answer-providers.ts` implementa Anthropic (SDK oficial, structured outputs, `effort: "low"` e `fallbacks: "default"` nos modelos que aceitam), Gemini (REST com `responseJsonSchema`, `thinkingLevel: "low"` nos modelos Gemini 3 e uma nova tentativa em 429/503; o padrão é `gemini-3.5-flash-lite`, porque o `gemini-2.5-flash` não aceita mais contas novas) e Ollama (`/api/chat` com `format`).
- `embeddings.ts` gera vetores de 768 dimensões via Gemini (`outputDimensionality`) ou Ollama (`nomic-embed-text`, com prefixos de tarefa). O vetor é gravado com a chave `provedor:modelo`; a busca só compara vetores do mesmo modelo.
- `asset-question-service.ts` expõe `answerAssetQuestion()` e `recordAssetAnswerFeedback()`.

## Regras

- O filtro de organização acontece no SQL (`search_management_asset_chunks_for_organization`), antes de qualquer ranking ou chamada de IA. Nunca envie ao modelo trechos sem esse filtro.
- Resposta sem citação válida vira recusa (`resolveGroundedAnswer`). Não relaxe essa regra para "melhorar" a taxa de resposta.
- Perguntas de continuação recebem até seis turnos anteriores (`history`). Eles entram no prompt depois das fontes, marcados como contexto e não como fonte; a busca combina a última pergunta da pessoa com a atual (`buildRetrievalQuery`).
- O conteúdo dos ativos entra no prompt como fonte, não como instrução; o prompt do sistema manda ignorar pedidos escritos dentro das fontes.
- Trocar de provedor é configuração, não código. Novos provedores entram em `answer-providers.ts` com o mesmo contrato `GroundedAnswer`.
- Planos gratuitos (Gemini) podem usar os dados enviados para melhorar o produto do provedor: use apenas conteúdo fictício nesses testes. Dados reais de cliente exigem plano pago com cláusula de não uso para treino.
- Mudou prompt, limiar ou provedor: rode `npm run eval:agent` (ver `tests/eval/`) e compare com a meta de 85%.
