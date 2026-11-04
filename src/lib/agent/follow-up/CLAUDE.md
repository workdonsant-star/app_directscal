# Classificação do acompanhamento dos Action Points

Regras puras, sem chamada de modelo, banco ou Slack. Uma extração de IA é apenas proposta de fatos; a classificação depende dos campos aprovados no plano e do estado de entrega e prazo. Resposta vaga ou contraditória permanece inconclusiva. Silêncio somente após entrega confirmada e prazo encerrado é `sem_resposta`; falha/incerteza do transporte é `nao_verificado`. Uma nova versão do plano deve conservar os resultados históricos da versão anterior. Não importar dados da demo para a operação.

`manual-follow-up.ts` define o contrato e pede detalhes para declarações genéricas como “fiz tudo”, inclusive quando acompanhadas de “sem impedimento”. `manual-follow-up-provider.ts` extrai uma proposta estruturada pelo motor selecionado; o texto do Slack é dado não confiável e não confirma execução por si só.
