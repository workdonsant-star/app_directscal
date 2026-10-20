# `/api/integrations/slack`

Endpoints públicos do app do Slack. Toda requisição valida a assinatura do Slack antes de ler o payload; nenhuma usa a sessão do app, exceto `install` e `oauth`.

- `events`: Events API. Responde `url_verification`, revoga a instalação em `app_uninstalled`/`tokens_revoked` e trata `app_mention` (responde na thread), `message.im` (mensagem direta) e `message.channels`/`message.groups` quando a mensagem é resposta numa thread em que o bot já participou, mesmo sem menção. Threads sem participação do bot são ignoradas. As mensagens anteriores da thread (ou da conversa direta) seguem como `history` para o agente. Confirma em menos de 3 segundos, registra o `event_id` para ignorar reenvios e processa a resposta com `after()`. Enquanto responde, reage na mensagem da pessoa conforme quantas vezes ela já fez a mesma pergunta nos últimos 30 dias (`countPreviousAsks`): 👍 na primeira, 👀 na segunda e 🧐 da terceira em diante. Falha na reação não impede a resposta.
- `interactions`: botões `Útil`/`Não útil`. Só a pessoa que perguntou registra avaliação; a mensagem original troca os botões por uma confirmação.
- `install`: inicia o OAuth para o Superadmin da empresa (`cliente`) com `state` assinado.
- `oauth`: callback do OAuth; confere `state` contra a sessão e grava a instalação.
- `installation` (`DELETE`): desconecta o workspace da empresa do Superadmin autenticado.

Eventos de bot a assinar: `app_mention`, `message.im`, `message.channels`, `message.groups`, `app_uninstalled`, `tokens_revoked`.

URLs a configurar no app do Slack: Event Subscriptions → `/api/integrations/slack/events`; Interactivity → `/api/integrations/slack/interactions`; Redirect URL → `/api/integrations/slack/oauth`.

Install e callback OAuth consultam a conclusão inicial da empresa: enquanto pendente, sucesso/cancelamento/erro retornam a `/onboarding`; após concluir, retornam a `/configuracoes`. Destino é fixo e derivado no servidor, sem return URL arbitrária.

A decisão de entrada usa `requiresOnboarding`, derivada no servidor: conclusão persistida ou instalação Slack ativa da própria empresa dispensam o onboarding inteiro. Sem ambos, a preparação é obrigatória. Conexão de outra empresa não libera acesso. A conclusão explícita continua revalidando setores e lideranças; dispensar a tela não grava conclusão nem transfere workspace.

A15 substitui o descarte por recibo no handler de eventos: persiste pergunta elegível em slack_delivery_jobs antes do 200, retorna 503 se falhar e agenda processSlackDelivery em after(). Assinatura continua antes do parse. Recibos legados não reexecutam. Processamento, falha e confirmação ficam persistidos; recuperação usa consumidor interno autenticado. Falha de contexto não vira histórico vazio. A fila exige instalação persistida ativa; fallback de ambiente não autoriza recebimento durável. Nenhuma mensagem foi enviada pelos testes.


A06: interactions também recebe Confirmar registro/Cancelar de proposta. Assinatura precede parse; DM e proposta UUID viram comando reservado na fila antes do 200, ou 503 quando persistência falha. O mesmo worker resolve a confirmação e prepara o aviso. Cliques repetidos não duplicam fatos. Feedback existente permanece separado; não usamos response_url para executar registros.
