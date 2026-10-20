# Operação e qualidade do agente — A17

Implementação local de 20/10/2026. Sem scheduler externo, alerta por mensagem ou deploy nesta entrega.

## Lacunas e saúde por empresa

A área Perguntas ao agente conserva consulta, resposta original, fonte, canal, provedor e data. A leitura busca todas as páginas da empresa, sem ocultar lacunas antigas pelo antigo limite de 200 registros. O diálogo permite abrir o registro completo e seu identificador.

Lacunas são respostas sem evidência, erros técnicos ou última avaliação não útil. Acompanhamento privado, imutável e versionado: aberta, em andamento ou resolvida. Responsável deve ter papel global ativo; resolver exige justificativa e link HTTPS de evidência. Prazo de retorno é opcional e fica no histórico. Reabertura cria evento; não apaga decisões, resposta ou avaliação original. A aba Lacunas mostra pendências; Todas conserva resolvidas e consultas sem lacuna.

Concorrência usa revisão esperada; tentativa repetida retorna o mesmo recibo, tentativa divergente falha. Operação global e empresa da auditoria são revalidadas no banco. Cliente/admin não leem os registros privados nem recebem nomes de outros operadores.

Saúde mostra contagens reais por empresa: consultas/erros em trinta dias; falhas, envios incertos e fila vencida do Slack. É um snapshot ao abrir/recarregar a página, não monitoramento contínuo. Os números não são uma nota de saúde inventada e não comprovam entrega ao destinatário. Supervisão de rotinas e recuperação de falhas ficam no workspace já existente da empresa.

## Histórico do cliente

No Agente, Histórico de consultas lista somente perguntas feitas no app pelo usuário autenticado na empresa atual, em páginas de 25. Revalida membership e recusa sessão temporária/global; cursor validado não aceita escolha de usuário/organização. Não reconstrói threads nem mistura mensagens do Slack por nome/e-mail. O registro conserva resposta e fontes/versionamento usados; link abre a publicação vigente, explicitamente informado na tela.

Não há exclusão/retencão automática nova; a política permanece dependente de A16.

## Runbook

1. Abrir a empresa e Perguntas ao agente. Separar erro técnico, falta de regra publicada e resposta não útil.
2. Atribuir operador global com prazo e justificativa. Não alterar a avaliação original para retirar uma lacuna da fila.
3. Para conteúdo: revisar a publicação vigente, publicar pela revisão editorial e repetir a pergunta. Para busca: conferir índice e reindexar quando necessário. Fechar somente com link de evidência verificável.
4. Para falha Slack: abrir recuperação no workspace de rotinas, conferir estado/versão. Falha confirmada pode ser retomada; envio incerto exige conferir mensagem no Slack antes de qualquer decisão. Nunca repetir cegamente um envio incerto.
5. Para silêncio/bloqueio/evidência: usar supervisão A07; prazo de retorno não altera o prazo original da oportunidade nem o denominador.
6. Sem alertas externos configurados, uma pessoa precisa assumir a consulta periódica da fila. Definir responsável e SLA operacional no aceite; não declarar que o sistema está sendo monitorado continuamente.

## Avaliação

`tests/eval/isolated-asset-agent.eval.ts`, habilitado explicitamente por `ASSET_EVAL_ISOLATED=true`, cria duas empresas e operador fictícios novos, publica quatro SOPs pelo fluxo editorial e consulta o serviço real com o provedor configurado. Outra empresa deve recusar e não receber citações. Usa `skipAudit` para não poluir histórico; finally remove somente as próprias fixtures e confere ausência.

O avaliador agora exige status, fonte esperada e fatos essenciais para perguntas objetivas. Falha técnica não conta como recusa correta. Triagem por expressões normalizadas é determinística e pode dar falsos negativos: não equivale a avaliação semântica completa e não dispensa revisão humana das respostas. Meta de 85% permanece; registrar provedor/modelo, conjunto, acertos e falhas antes de alegar aceite.


### Rodada inicial e correção do conjunto

A primeira rodada concluiu 43/50 perguntas antes de atingir vinte minutos. Houve timeout/503 do provedor e falhas em perguntas ambíguas; resultado parcial não é aprovação. As duas empresas e o operador fictícios foram removidos e ausência conferida. Foi acrescentado pedido de contexto antes da busca para perguntas genéricas sem histórico, e o prompt deixou explícito que coordenar onboarding não prova ser responsável pelo kickoff/ata. A expectativa amb-04 foi corrigida para recusa a partir do texto do SOP; o conjunto v2 conserva cinquenta perguntas. Essa mudança de critério precisa aparecer no relatório, sem apresentar comparação direta como se o conjunto fosse idêntico. A nova execução salva cada resultado, limita concorrência a dois e dispõe de 45 minutos.


A função HTTP de consulta passa a declarar duração máxima de 180 s, compatível com os orçamentos de embedding/modelo/retry existentes; o limite anterior de 60 s podia interromper o tratamento antes de devolver erro/auditoria. Isso não acelera o provedor. Confirmar suporte da plataforma e SLA/latência em A17 antes de produção; indisponibilidade e timeout continuam falhas na avaliação.


## Fechamento da avaliação — 20/10/2026

Rodada v3 real: Gemini `gemini-3.5-flash-lite`, embeddings `gemini:gemini-embedding-001`, cinquenta perguntas, **43/50 (86%)** na triagem automática. Inclui quatro erros técnicos (fin-02, fin-08, pap-01, sem-06), duas recusas onde o conjunto esperava resposta (cmp-05, amb-03) e amb-04 com resposta parcial marcada como completa. Meta automática de 85% atingida; isso não encerra aceite operacional ou revisão semântica.

A resposta amb-04 reconhecia que o documento não especifica nominalmente quem produz a ata. A regra final passou a reconhecer advérbios e recusar essa lacuna de atribuição. Reprocessamento determinístico das mesmas cinquenta respostas com essa regra: **44/50 (88%)**, mudando somente amb-04. **Não é nova rodada do modelo, busca/banco ou E2E.** O resultado real bruto de 86% permanece preservado.

V2 também teve 43/50, mas com casos distintos e falso negativo lexical pap-09. V3 aceita exclusão explícita de jornada sem exigir literalmente a palavra não; a resposta esperada não foi alterada. Não atribuir a diferença de critérios apenas ao prompt. A checagem pontual anterior à correção de status permanece como evidência negativa.

Artefatos em `docs/evidencias/`: JSON bruto v2, bruto v3, reprocessamento e manifestos de fonte. O único arquivo de produção diferente do manifesto da rodada v3 é answer-policy.ts, referente ao reprocessamento testado. Empresas e operador fictícios removidos; ausência conferida por leitura independente. Nenhum dado real de cliente foi enviado ao modelo nesses testes.

Pendências para A17: investigar os quatro erros técnicos pelos logs e validar capacidade/latência no ambiente de produção; conferir cobertura e busca para registro da aprovação e problema encontrado na revisão de campanha; aceitar comportamento de recusa e repetir piloto real após implantação. Operador, SLA, canal/monitoramento, política A16 e revisão visual continuam pendentes. Não há aviso externo automático implementado/configurado nesta entrega.
