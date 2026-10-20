# Agendamento de contatos

POST sem payload percorre até 25 rotinas de políticas ativadas explicitamente. Exige Bearer SLACK_DELIVERY_WORKER_SECRET (mínimo 32 caracteres, comparação constante), fechado por padrão. Empresa/origem/vínculos são revalidados no banco. Não manda mensagem; cria oportunidade/contato duráveis para o consumidor da fila Slack. Cursor persistido evita monopolização por rotina antiga/erro. Não configura scheduler externo ou ativa políticas existentes.


A07: resposta inclui reminders com checked/ensured/failed. Segundo lote justo limitado a 25 ciclos; um único lembrete após 24h, mesma janela/cota. Relato/proposta/intervenção cancela e conversa recente adia. Não publica mensagens nem faz escalonamento automático por DM.
