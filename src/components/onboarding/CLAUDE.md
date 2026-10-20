# Onboarding de cliente

Fluxo autenticado sem sidebar: Slack; setores com lideranças selecionadas do diretório Slack; revisão e conclusão. Reutiliza `OrganizationStructureSettings` com ação inline. Cargo opcional preenchido do perfil, setor obrigatório, sem convite/e-mail/nível de acesso. Pessoas atuam somente no Slack.

Etapas posteriores não abrem antes do Slack válido. Pessoa removida ou referência de workspace antigo bloqueia conclusão; convites anteriores mantêm compatibilidade. Progresso persistido vem do servidor; estado local controla apenas revisão. Finalização usa POST `/api/settings/onboarding` e navegação completa para renovar shell. Tema e saída sempre disponíveis. Testes de UI usam pessoas fictícias e não autorizam instalação real ou envio de convites.
