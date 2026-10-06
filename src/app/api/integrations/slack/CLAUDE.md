# `/api/integrations/slack`

Endpoints públicos do app do Slack. Toda requisição valida a assinatura do Slack antes de ler o payload; nenhuma usa a sessão do app, exceto `install` e `oauth`.

- `events`: Events API. Responde `url_verification`, revoga a instalação em `app_uninstalled`/`tokens_revoked` e trata `app_mention` (responde na thread), `message.im` (mensagem direta) e `message.channels`/`message.groups` quando a mensagem é resposta numa thread em que o bot já participou, mesmo sem menção. Threads sem participação do bot são ignoradas. As mensagens anteriores da thread (ou da conversa direta) seguem como `history` para o agente. Confirma em menos de 3 segundos, registra o `event_id` para ignorar reenvios e processa a resposta com `after()`. Enquanto responde, reage na mensagem da pessoa conforme quantas vezes ela já fez a mesma pergunta nos últimos 30 dias (`countPreviousAsks`): 👍 na primeira, 👀 na segunda e 🧐 da terceira em diante. Falha na reação não impede a resposta.
- `interactions`: botões `Útil`/`Não útil`. Só a pessoa que perguntou registra avaliação; a mensagem original troca os botões por uma confirmação.
- `install`: inicia o OAuth para o Superadmin da empresa (`cliente`) com `state` assinado.
- `oauth`: callback do OAuth; confere `state` contra a sessão e grava a instalação.
- `installation` (`DELETE`): desconecta o workspace da empresa do Superadmin autenticado.

Eventos de bot a assinar: `app_mention`, `message.im`, `message.channels`, `message.groups`, `app_uninstalled`, `tokens_revoked`.

URLs a configurar no app do Slack: Event Subscriptions → `/api/integrations/slack/events`; Interactivity → `/api/integrations/slack/interactions`; Redirect URL → `/api/integrations/slack/oauth`.
