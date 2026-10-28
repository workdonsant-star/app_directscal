# Entrega e recuperação Slack — A15

Implementação local em 20/10/2026. A fila privada foi aplicada ao banco OMDx; não houve deploy, configuração de scheduler externo nem envio real de mensagens nesta validação.

## Causa corrigida

O recibo anterior marcava um evento antes do processamento, e uma falha depois do HTTP 200 tornava os reenvios do Slack inoperantes. Agora o webhook persiste a pergunta elegível antes de confirmar o recebimento; falha de persistência responde 503. Assinatura continua obrigatória antes de interpretar o JSON. O desafio de configuração, revogação e descarte de bots/subtipos permanecem.

## Estados e recuperação

- Recebido: evento e empresa resolvidos pela instalação ativa, com event_id único e payload consistente. Recibos anteriores à migração não são reexecutados.
- Processando: reserva exclusiva de três minutos, com token UUID e até cinco tentativas automáticas. Um segundo worker não assume a mesma reserva.
- Resposta preparada: texto/blocos persistem antes do envio. Recuperação utiliza a resposta guardada, sem pedir outra geração.
- Concluído: mensagem confirmada pelo Slack, com canal e timestamp, ou evento deliberadamente ignorado por não pertencer à conversa do bot. Ignorado não possui timestamp de envio.
- Falhou: causa segura, prazo da próxima tentativa e indicação de recuperação automática. 429 respeita Retry-After; credencial revogada, escopo insuficiente ou canal indisponível exigem correção antes de repetição manual.
- Incerto: processo caiu durante envio, timeout, erro do servidor ou confirmação inconsistente. Não há retry automático ou botão de reenvio desse evento. Essa decisão evita duplicar mensagens quando o Slack recebeu, mas o app perdeu a confirmação.

Expiração antes do início do envio permite recuperação. Expiração durante envio muda para Incerto; não equivale a Falhou. O limite final encerra reservas sem processo, evitando estado Processando permanente. O identificador do cliente enviado ao Slack é adicional; a proteção contra duplicação não depende de uma garantia de deduplicação do provedor.

Falha de contexto não vira histórico vazio silencioso: o processamento falha e pode ser recuperado. Instalação é revalidada antes do envio com fallback de ambiente desativado; token antigo não reativa uma conexão revogada. A fila exige instalação OAuth persistida. O fallback de teste por variáveis continua disponível nos helpers legados, mas não habilita o ingresso durável.

## Operação

`GET /api/admin/companies/[id]/slack-deliveries` lista metadados com paginação de 100 por página, sem texto da conversa ou tokens. Exige superadmin definitivo e revalida membership global. Empresa é resolvida pela rota. Resposta e falha não são expostas ao cliente.

`POST` na mesma rota recebe somente id e expectedUpdatedAt. Depois de corrigir uma falha confirmada, recoloca o evento na fila; conflito conserva o estado. Incerto não pode ser repetido por esse caminho. Histórico detalhado e apresentação de saúde pertencem à A17.

`POST /api/internal/slack-deliveries` processa uma entrega disponível por chamada. Exige Bearer de SLACK_DELIVERY_WORKER_SECRET, com pelo menos 32 caracteres e comparação em tempo constante. Sem segredo, recusa acesso. O acionamento imediato por after() reduz latência, mas é apenas a primeira tentativa; a fila conserva trabalho mesmo se o processo terminar. A implantação deve configurar um consumidor periódico autenticado e monitorar falhas. Não registrar o segredo em comandos compartilhados, CRM ou screenshots.

## Runbook

1. Consultar o estado da entrega da empresa. Conferir id, canal/timestamp de origem, tentativas, causa segura e próxima tentativa.
2. Recebido/processando com lease válido: aguardar o consumidor, sem nova chamada de geração ou envio manual.
3. Falha do provedor: conferir saúde/configuração; uma tentativa automática ocorre depois da janela. Após cinco tentativas, corrigir a causa e usar a recuperação autenticada com updatedAt atual.
4. Token revogado/escopo insuficiente: reconectar o workspace correto pelas configurações do cliente. Não trocar instalação por outra empresa nem liberar permissões adicionais sem necessidade. Depois, repetir somente a falha confirmada.
5. Rate limit: respeitar a janela registrada. Não antecipar tentativas manuais nem paralelizar envios no mesmo evento.
6. Incerto: abrir a conversa original no workspace correto e localizar eventual resposta. Registrar na revisão humana se houve entrega e a evidência. Não reenviar automaticamente. Resolução operacional desse caso exige revisão explícita na A17.
7. Confirmar canal/timestamp persistidos e ausência de uma segunda mensagem antes de encerrar o incidente. Falha no registro final do banco permanece Incerto após expiração, mesmo que o Slack tenha recebido.

## Privacidade e prova

Pergunta e resposta ficam somente no schema privado com RLS e sem acesso anon/authenticated. Metadados operacionais não incluem tokens nem conteúdo textual. Finalidade/retenção e público detalhado devem ser aprovados na A16; a migração não apaga conversas históricas automaticamente.

SQL transacional com ROLLBACK aprovou: reentrada, payload divergente, reserva exclusiva, token errado, ordem preparar/enviar/confirmar, Retry-After, resposta preservada, recuperação de lease, envio incerto, limite final, autorização do retry e grants de service_role. Testes unitários cobrem webhook, transporte, geração falha, banco indisponível antes/depois do envio, troca de empresa, token revogado, escopo insuficiente e autenticação do consumidor. Nenhum desses testes envia mensagens reais.

Piloto pendente: evento assinado do Slack, consumidor implantado, indisponibilidade provocada em ambiente de teste e confirmação única na conversa. Não confundir testes com substitutos ou SQL com prova de entrega real.

Fontes: [Events API](https://docs.slack.dev/apis/events-api/), [chat.postMessage](https://docs.slack.dev/reference/methods/chat.postMessage/) e documentação local Next.js after().

## Superfície operacional — 26/10/2026

No detalhe da empresa, Entregas no Slack consulta a API existente sob demanda, com paginação e preservação da lista após falha. Pendente, Processando, Entregue, Encerrado sem envio, Falhou e Incerto são distintos. A confirmação entregue exige deliveredTs. Tentativa automática mostra a janela; somente falha sem tentativa automática oferece Recuperar entrega, após confirmar correção da causa. O POST conserva expectedUpdatedAt e as barreiras do servidor. Uma resposta perdida trava novas ações até Atualizar; erro nunca simula sucesso. O painel não ativa consumidor periódico nem comprova entrega externa.

## Piloto real de DM/thread — 26/10/2026

Três perguntas fictícias explicitamente autorizadas chegaram pela instalação existente. Resposta com fonte, continuação na thread e recusa por ausência de informação foram confirmadas no Slack. Os três jobs ficaram concluídos com uma tentativa e timestamp de entrega, sem duplicação observada. Versões citadas conferidas com as publicações vigentes. Ver `ciclo-2-ativos-e-consulta-2026-10-26.md` e `evidencias/ciclo-2-2026-10-26/slack-pilot.json`.

A prova cobre o processamento imediato. Consumidor periódico, recuperação após falha controlada e envio incerto continuam sem piloto real; nenhum desses cenários deve ser inferido das três entregas bem-sucedidas.
