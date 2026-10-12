# Onboarding de cliente

Fluxo autenticado sem sidebar com três etapas: Slack; cadastro de setores e responsáveis; revisão dos convites e conclusão. Reutiliza `OrganizationStructureSettings` com ação inline e drawer transacional. O cadastro de setor já configura e convida a liderança, evitando duplicação de contratos.

Etapas posteriores não abrem antes do Slack válido. Falhas de envio bloqueiam conclusão e a tabela permite reenvio. O aceite das lideranças é assíncrono. Progresso persistido vem do servidor; estado local controla apenas a revisão visual. Finalização usa POST `/api/settings/onboarding` e navegação completa para renovar o shell. Tema e saída ficam sempre disponíveis. Não executar testes com convites ou OAuth reais sem intenção explícita.
