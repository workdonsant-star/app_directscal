# Processadores internos

Handlers de processamento durável sem sessão de navegador. Cada consumidor exige segredo dedicado configurado, recusa acesso quando ausente e processa carga limitada. Não aceitar empresa ou ator como substituto de autenticação. Configuração de acionamento e monitoramento deve ser homologada na implantação; não criar scheduler externo por efeito colateral de teste.

A05: routine-contacts agenda até 25 rotinas de políticas explicitamente ativadas. Não aceita escopo no payload e usa o mesmo segredo dedicado obrigatório do consumidor Slack. Avanço persiste por rotina para permitir lotes justos e recuperação; não implica configuração de cron em produção.


A07: routine-contacts agenda em sequência o lote de oportunidades e até 25 lembretes. Lembrete usa o mesmo consumidor Slack e não cria ciclo. Horários/cotas/pausa continuam na revalidação do despacho. Sem scheduler externo e sem políticas ativadas por leitura.


A14: password-resets exige PASSWORD_RESET_WORKER_SECRET dedicado >=32 caracteres com comparação constante. Processa uma entrega por chamada, reserva exclusiva, cinco tentativas e idempotência por solicitação. after() faz primeira tentativa; scheduler/monitoramento externo permanecem pendentes e não são criados por testes.
