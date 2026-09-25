# `/api/integrations/slack`

Endpoint da Slack Events API. Recebe a validação inicial da URL e menções ao app, consulta SOPs publicados da organização configurada no ambiente e responde na thread original. Não recebe autenticação da sessão do usuário; a assinatura do Slack e o vínculo `SLACK_ORGANIZATION_ID` são obrigatórios.
