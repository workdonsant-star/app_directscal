# Concluir configuração inicial

POST exige sessão regular `cliente`, deriva empresa do membership e revalida instalação Slack, escopos e referência Slack ativa em cada setor ativo (cargo opcional, sem convite/Google; convites legados continuam compatíveis). Retorna 409 para etapas incompletas, 401 sem sessão e 403 para outros papéis/intents. Conclusão é idempotente por empresa; não recebe IDs do client. Erros de infraestrutura não expõem detalhes.
