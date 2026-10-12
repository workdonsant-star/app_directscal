# Concluir configuração inicial

POST exige sessão regular `cliente`, deriva empresa do membership e revalida instalação Slack, escopos e convite enviado/liderança ativa em cada setor ativo. Retorna 409 para etapas incompletas, 401 sem sessão e 403 para outros papéis/intents. Conclusão é idempotente por empresa; não recebe IDs do client. Erros de infraestrutura não expõem detalhes.
