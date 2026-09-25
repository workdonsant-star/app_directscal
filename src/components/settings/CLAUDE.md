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
- Usar um único card com divisórias internas entre dados oficiais, informações comerciais e ações.
- Usar os primitives de `src/components/ui/`, tokens do design system e campos desabilitados para dados oficiais.
- O CTA `Salvar alterações` fica na topbar, antes do sino, via `AppTopbarActionsPortal`; deve bloquear durante o salvamento. O retorno de sucesso ou erro permanece no próprio formulário.
- A tabela recebe `OrganizationSector[]` do Server Component. Nome e avatar ausentes aparecem como `Aguardando confirmação` até o vínculo com Google.
- A criação usa um drawer e envia o convite no mesmo submit. Falhas permanecem visíveis na tabela e podem ser reenviadas sem duplicar o setor.
- O drawer exige o nível `Superadmin` ou `Admin`; a tabela exibe esse acesso. `Superadmin` representa `cliente` no contrato técnico e `Admin` representa `admin`.
