# Classificação do acompanhamento dos Action Points

Regras puras, sem chamada de modelo, banco ou Slack. Uma extração de IA é apenas proposta de fatos; a classificação depende dos campos aprovados no plano e do estado de entrega e prazo. Resposta vaga ou contraditória permanece inconclusiva. Silêncio somente após entrega confirmada e prazo encerrado é `sem_resposta`; falha/incerteza do transporte é `nao_verificado`. Uma nova versão do plano deve conservar os resultados históricos da versão anterior. Não importar dados da demo para a operação.

## Teste manual

manual-follow-up.ts define a pergunta e o contrato conservador de extração. manual-follow-up-provider.ts usa o motor de IA configurado para propor um resumo. O líder confirma ou corrige; executado_relato é declaração, não prova.
