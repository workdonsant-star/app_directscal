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
- `repeat-questions.ts` conta quantas vezes a mesma pessoa (`external_user_id`) já fez a mesma pergunta nos últimos 30 dias, a partir de `asset_question_audits`. Texto normalizado igual sempre conta; com `ASSET_AGENT_PROVIDER=gemini`, o Gemini julga o sentido (timeout de 8 s, cai no texto se falhar). Embeddings não são usados aqui porque não separam assuntos vizinhos.


A17: needsQuestionContext recusa perguntas genéricas sem processo/atividade e sem histórico antes de buscar fontes ou chamar o modelo. Pergunta específica e continuação com histórico seguem o fluxo normal. Prompt proíbe inferir responsabilidade por ato específico a partir de coordenação geral. Avaliação inicial interrompida aos vinte minutos, com falhas de provedor/contexto; nova rodada v2 registra cada resposta, usa duas consultas simultâneas e permite 45 minutos. Mudança de expectativa amb-04 é correção explícita do conjunto: SOP não atribui kickoff/ata, portanto deve recusar. Não comparar percentuais entre conjuntos sem essa ressalva.


A17: instrução de segunda pessoa aplica-se a orientação de execução, não a identificação de responsável. resolveGroundedAnswer recebe contexto da pergunta e transforma em recusa uma resposta que admite explicitamente não definir quem responde por um ato solicitado. Essa checagem estreita de consistência não é verificador semântico geral. Conjunto v3 também corrige falso negativo de pap-09: exclusão explícita de jornada é válida sem exigir literalmente a palavra não. Relatórios v2 brutos são preservados; comparação precisa declarar a diferença do avaliador.


A17 final: hasExplicitResponsibilityGap reconhece ausência explícita de ator com advérbios; teste/reprocessamento v3 confirma mudança apenas em amb-04 dentre cinquenta respostas guardadas. Não trata isso como verificação semântica geral nem nova rodada IA. Bruto v3=43/50; replay=44/50.
