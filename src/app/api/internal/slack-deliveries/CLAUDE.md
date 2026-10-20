# Processador da fila Slack

POST processa no máximo uma entrega vencida. Exige Bearer SLACK_DELIVERY_WORKER_SECRET de pelo menos 32 caracteres, comparado em tempo constante; sem configuração recusa todo acesso. Não usa cookie/sessão, não aceita empresa/payload. Consumidor externo deve invocar periodicamente após implantação; esta entrega não configura cron em produção nem envia mensagens nos testes. Falhas e leases permanecem duráveis.
