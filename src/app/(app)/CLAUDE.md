# Shell autenticado

Leia `src/app/CLAUDE.md` e `AGENTS.md`. O layout resolve sessão/empresa e compõe SidebarProvider, AppSidebar e SidebarInset. O escopo de iniciativas é `<userId>:<primaryOrganizationId>`, com fallback local somente para sessão demo.

O shell segue o frame Figma `318:2`: `SidebarInset` é a superfície única com raio de 20px, recuo externo de 20px no desktop e topbar de 56px dentro dela. A topbar usa o fundo do conteúdo e alinha suas ações ao `AppPage`. As páginas continuam responsáveis por AppTopbar e AppPage. Rotas de domínio preservam suas regras de autorização; novas iniciativas e áreas de ativos rejeitam superadmin.

No cabeçalho da sidebar do superadmin global, o subtítulo é `Directscal`, pois a organização técnica do vínculo de autenticação não representa uma empresa cliente. Cliente e admin da empresa continuam exibindo o nome empresarial resolvido pelo perfil.

O layout redireciona donos (`cliente`) com empresa e configuração inicial pendente para `/onboarding`, antes de ler ativos ou renderizar navegação. A dispensa vem da conclusão privada ou instalação Slack ativa da empresa. Admin convidado, superadmin global e sessão demo sem empresa preservam seus fluxos.

O gate usa `requiresOnboarding`: conclusão persistida ou Slack ativo da própria empresa dispensam a preparação. O vínculo de workspace de outra empresa nunca é reaproveitado.

O shell ocupa 100svh e impede rolagem externa. O main (ou app-content) abaixo da topbar é o contêiner de rolagem, com flex: 1 e min-height: 0. O raio pertence ao `SidebarInset` e recorta topbar e conteúdo também durante o scroll. O `AppPage` começa logo após a topbar, sem espaço vertical adicional. Não devolver a rolagem ao body nem aplicar min-height de viewport ao conteúdo.

SidebarInset usa `overflow-clip` explícito, sem criar área de rolagem programática externa. Âncoras devem movimentar somente o main interno e preservar a topbar dentro da superfície.

- `organization_asset_navigation` persiste ordem e ícones por empresa com RLS e grants somente service_role. `asset-navigation` define payload estrito e catálogo fechado; layout lê pela empresa da sessão, PUT /api/settings/asset-navigation exige dono cliente e ignora qualquer tentativa de escolher organização no payload. Sem localStorage nem modificação de documentos/categorias.

- Layout incorpora categories persistidas às pastas dos ativos, inclusive vazias. Chaves estáveis conservam endereço e preferências depois de renomear.
- O layout libera os controles de categorias da sidebar apenas para dono `cliente` com sessão definitiva; sessões de aquisição e outros papéis não recebem esse controle. A API revalida a autorização antes de gravar.
- Após o gate de onboarding, nome da empresa para a sidebar, metadados dos ativos publicados e preferências de navegação são lidos em paralelo. O perfil completo fica nas páginas próprias; o redirect de autorização continua antes dessas leituras.
- O layout externo renderiza um skeleton do shell via Suspense enquanto o layout interno valida sessão, onboarding e navegação. O fallback não contém dados de usuário nem conteúdo protegido; somente o layout interno renderiza `children` depois da autorização.

## Carregamento compartilhado

Os `loading.tsx` das rotas autenticadas mostram skeletons no formato do conteúdo de cada página, sem dados protegidos. O fallback inicial do layout usa o skeleton do shell. `error.tsx` oferece nova tentativa sem detalhes internos.
O fallback do shell replica a sidebar expandida e a superfície única com topbar interna e raio de 20px. Ele não consulta nem exibe identidade antes da autorização.
