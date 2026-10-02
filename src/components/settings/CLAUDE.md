# `src/components/settings` — Configurações da empresa

Componentes da página `/configuracoes`, responsável pelos dados empresariais da conta autenticada.

## Propósito

- Exibir nome fantasia, razão social, CNPJ, situação cadastral e demais informações oficiais retornadas pela Minha Receita.
- Exibir e permitir editar as informações comerciais coletadas no onboarding.
- Manter dados oficiais, endereço e desafios em estado somente leitura.
- Preservar `Posição na empresa` na página `/perfil`, porque o campo descreve a pessoa autenticada.
- Exibir a tabela operacional de setores e lideranças fora de cards, seguindo o padrão visual de Diagnósticos.

## Convenções

- A página injeta `ProfileSettingsData`; componentes desta pasta não acessam Supabase ou sessão diretamente.
- Escritas comerciais passam por `PATCH /api/profile`; service role permanece somente no servidor.
- Usar uma única superfície `surface/sidebar`, sem borda ou sombra, com divisórias internas entre dados oficiais, informações comerciais e ações.
- Usar os primitives de `src/components/ui/`, tokens do design system e campos desabilitados para dados oficiais.
- Os CTAs `Adicionar setor` e `Salvar alterações` ficam na topbar, antes do sino, via `AppTopbarActionsPortal`; o salvamento deve bloquear durante a requisição. O retorno de sucesso ou erro permanece no respectivo bloco.
- O título `Setores e lideranças` é o `h1` da página; a topbar não repete `Configurações` como breadcrumb.
- A tabela recebe `OrganizationSector[]` do Server Component. Nome e avatar ausentes aparecem como `Aguardando confirmação` até o vínculo com Google.
- A criação usa um drawer e envia o convite no mesmo submit. Falhas permanecem visíveis na tabela e podem ser reenviadas sem duplicar o setor.
- O drawer exige o nível `Superadmin` ou `Admin`; a tabela exibe esse acesso. `Superadmin` representa `cliente` no contrato técnico e `Admin` representa `admin`.
- `SlackIntegrationSettings` mostra o estado da conexão com o Slack e oferece `Conectar Slack` (OAuth em `/api/integrations/slack/install`) ou `Desconectar`. Fica desabilitado quando o app do Slack não está configurado no ambiente.
