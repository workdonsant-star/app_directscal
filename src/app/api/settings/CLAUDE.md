# `/api/settings` — Estrutura da empresa

Handlers autenticados. A organização é derivada da sessão e de `getProfileSettingsData`, nunca do navegador. Somente `cliente` com sessão regular pode consultar diretório e configurar liderança.

`slack-users` lista o diretório ativo ao vivo, sem persistir pessoas e sem cache. `sectors` recebe contrato estrito `createSlackSectorLeaderInputSchema`: nome do setor, user ID Slack e cargo opcional. Revalida pessoa no token da empresa e grava vínculo transacional via service role, sem convite ou acesso ao painel. Dados de perfil nunca são aceitos do navegador. Não exige e-mail nem cargo. RPC checa novamente dono e workspace.

Handlers antigos de reenvio/aceite Google permanecem para registros anteriores; não participam do novo onboarding. O papel superadmin global continua proibido e selecionar alguém no Slack não concede membership.

- `organization_asset_navigation` persiste ordem e ícones por empresa com RLS e grants somente service_role. `asset-navigation` define payload estrito e catálogo fechado; layout lê pela empresa da sessão, PUT /api/settings/asset-navigation exige dono cliente e ignora qualquer tentativa de escolher organização no payload. Sem localStorage nem modificação de documentos/categorias.

- asset-categories cria e renomeia pastas por POST/PATCH para o dono definitivo. Organização/ator resolvidos no servidor. Registro e renomeação dos ativos são atômicos; a API de navegação preserva categorias ao salvar ordem/ícones.
