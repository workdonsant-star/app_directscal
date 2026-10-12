# `supabase` — Migrations e configuração

## Propósito

Contém configuração local e migrations SQL para a base Supabase de produção do Maturidade.

## Convenções

- Migrations devem ser versionadas, revisáveis e idempotentes quando possível.
- Toda tabela no schema `public` deve ter RLS habilitado.
- `next_auth` segue o schema esperado pelo Auth.js Supabase Adapter.
- `next_auth.users.email` é a fonte de unicidade de conta; migrations novas devem preservar a unicidade normalizada por `lower(trim(email))` sem apagar dados históricos.
- Funções `security definer` ficam em schema privado, nunca em schema exposto.
- `app_private.is_org_member()` e `app_private.can_access_diagnostic()` devem negar identidades que possuam papel `superadmin`; esse papel usa apenas policies e handlers administrativos explícitos.
- Seeds do Maturidade v1 são imutáveis; mudanças futuras criam nova versão de template.
- Campos adicionais do onboarding de aquisição ficam em `acquisition_campaign_fields` e suas respostas em `acquisition_leads.field_values`; não criar coluna dedicada para cada campo configurável.
- Ativos de gestão: `management_asset_versions.review_status` guarda o estado editorial da versão; `management_assets.status` comunica o que o cliente enxerga. Um trigger impede alterar versões publicadas, e um índice único parcial garante um único rascunho por ativo.
- A busca dos ativos usa a configuração `public.pt_unaccent` (português sem acentos) e vetores `extensions.vector(768)` com o modelo gravado em `embedding_model`. `search_management_asset_chunks_for_organization` só é executável pela service role e filtra a organização antes do ranking.
- `app_private.slack_installations` guarda o token do bot por workspace e nunca recebe grant para `anon` ou `authenticated`.

- account_profiles preserva escolhas pessoais sem alteração pelo login Google, com FK para next_auth.users. Um trigger invoker sincroniza nome/foto com organization_people na mesma transação. specialists conserva IDs legados e usa exclusão lógica para preservar autorias. Ambas têm RLS e grants somente para service_role.

- `action_point_assignments` e `action_point_events` guardam a execução dos action points publicados (responsável do Slack, etapa, janela, cadência, progresso de 0 a 100 e histórico com frase de ação e detalhe; o tipo `resposta` é reservado para as respostas do líder ao agente). A seleção continua em `admin_deliveries.selected_action_point_ids`; o catálogo, no código. RLS habilitado e grants somente para service_role; a leitura e a escrita passam por handlers server-side que filtram pela empresa. A migração `20261009150000_action_point_execution.sql` foi escrita e revisada, mas não aplicada em nenhum ambiente.

- `20261012144255_client_onboarding_completions.sql` adiciona registro privado idempotente de conclusão inicial por empresa. Não reutiliza campos do onboarding operacional e não marca contas existentes como concluídas automaticamente. RLS e acesso SELECT/INSERT exclusivo de service_role. Migração aplicada no projeto OMDx em 12/10/2026; RLS e grants conferidos por consulta. Nenhuma empresa foi marcada como concluída.
