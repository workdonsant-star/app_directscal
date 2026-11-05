# Classificação do acompanhamento dos Action Points

Regras puras, sem chamada de modelo, banco ou Slack. Uma extração de IA é apenas proposta de fatos; a classificação depende dos campos aprovados no plano e do estado de entrega e prazo. Resposta vaga ou contraditória permanece inconclusiva. Silêncio somente após entrega confirmada e prazo encerrado é `sem_resposta`; falha/incerteza do transporte é `nao_verificado`. Uma nova versão do plano deve conservar os resultados históricos da versão anterior. Não importar dados da demo para a operação.

`manual-follow-up.ts` define o contrato e identifica declarações completas como “fiz tudo”, inclusive com “sem impedimento”. Elas são registradas diretamente como conclusão relatada pela pessoa, sem verificação de execução e sem exigir evidência. `manual-follow-up-provider.ts` extrai uma proposta estruturada pelo motor selecionado para os demais relatos; o texto do Slack é dado não confiável e não comprova execução por si só.
