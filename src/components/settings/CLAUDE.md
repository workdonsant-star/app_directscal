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
- Cada seção tem seu próprio `h1`: Setores e lideranças, Empresa ou Slack. A topbar não repete Configurações como breadcrumb.
- A tabela recebe `OrganizationSector[]` do servidor. Novas lideranças vêm do Slack: nome, foto e cargo são lidos ao vivo; não há cadastro local de pessoa.
- O drawer lista todas as pessoas ativas do workspace, incluindo convidados, com busca por nome/cargo, carregamento, erro e nova tentativa. Seleção usa radios acessíveis. Bots e desativados não aparecem. Cada abertura consulta novamente o Slack.
- Após selecionar a pessoa, o cargo do Slack preenche o campo opcional. Só ajustes manuais são enviados; ausência de ajuste mantém o cargo vindo do Slack. O setor é obrigatório. Salvar não envia convite nem concede acesso ao painel; as lideranças atuam somente pelo Slack.
- `SlackIntegrationSettings` mostra o estado da conexão com o Slack e oferece `Conectar Slack` (OAuth em `/api/integrations/slack/install`) ou `Desconectar`. Fica desabilitado quando o app do Slack não está configurado no ambiente.

- Todas as tabelas visíveis usam o padrão das Dimensões de 06/10/2026 via `Table`: cabeçalho neutro de 44px com raio de 5px, padding horizontal de 16px, linhas de pelo menos 55px e divisórias de 0,5px entre linhas, sem borda externa nem fundo no hover. Conteúdo documental pode ampliar a altura; o editor preserva a indicação de células selecionadas.

- `SlackIntegrationSettings` também mostra `Reconectar Slack` quando a instalação não tem as permissões `users:read` e `im:write` (`needsReconnect`, calculado na página). Sem elas, a página Action Points não consegue listar as pessoas do workspace.

- `OrganizationStructureSettings` também atende `/onboarding` com `inlineActions`: CTA no fluxo da página, título h2 e o mesmo drawer e APIs de seleção pelo Slack. Em Configurações mantém h1 e ações na topbar.

- Configurações mostra uma seção por vez via `secao`: setores (padrão), empresa e slack. Somente a seção montada injeta suas ações na topbar. Após desconectar Slack, permanece em `?secao=slack`; retornos OAuth legados `?slack=...` abrem Slack automaticamente.

Apresentação isolada: os mesmos componentes são reutilizados em /demo via AppRuntimeProvider. Links e requisições usam useAppRuntime; o default mantém as URLs/fetch do produto. A fonte local recusa operações desconhecidas, sem encaminhar para serviços reais. Não inserir condições visuais específicas de demo nestes componentes.
