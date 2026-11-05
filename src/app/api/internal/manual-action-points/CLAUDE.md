# Agendamento automático dos Action Points

GET é chamado pelo Supabase Cron a cada cinco minutos. Exige assinatura HMAC de curta duração baseada em `CRON_SECRET` com pelo menos 32 caracteres e não aceita empresa nem ator por parâmetro. Busca os horários locais de Brasília, revalida o cadastro no envio e usa `scheduled_slot` único por ação/ocorrência. Envios incertos exigem revisão humana. A migração e o segredo devem estar aplicados antes de ativar o cron em produção.
