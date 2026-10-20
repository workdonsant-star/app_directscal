# Shell autenticado

Leia `src/app/CLAUDE.md` e `AGENTS.md`. O layout resolve sessão/empresa e compõe SidebarProvider, AppSidebar e SidebarInset. O escopo de iniciativas é `<userId>:<primaryOrganizationId>`, com fallback local somente para sessão demo.

O shell do frame 242:267 usa `app-shell`, `bg-shell`, sidebar/topbar contínuas e conteúdo com raio de 20px via globals.css. Topbars ficam fora da superfície arredondada. As páginas continuam responsáveis por AppTopbar e AppPage. Rotas de domínio preservam suas regras de autorização; novas iniciativas e áreas de ativos rejeitam superadmin.

O layout redireciona donos (`cliente`) com empresa e configuração inicial pendente para `/onboarding`, antes de ler ativos ou renderizar navegação. A dispensa vem da conclusão privada ou instalação Slack ativa da empresa. Admin convidado, superadmin global e sessão demo sem empresa preservam seus fluxos.

O gate usa `requiresOnboarding`: conclusão persistida ou Slack ativo da própria empresa dispensam a preparação. O vínculo de workspace de outra empresa nunca é reaproveitado.

O shell ocupa 100svh e impede rolagem externa. O main (ou app-content) abaixo da topbar é o contêiner de rolagem, com flex: 1 e min-height: 0. O raio de 20px permanece fixo e recorta o conteúdo também durante o scroll. Não devolver a rolagem ao body nem aplicar min-height de viewport ao conteúdo.

SidebarInset usa `overflow-clip` explícito, sem criar área de rolagem programática externa. Âncoras devem movimentar somente o main interno e preservar a posição da superfície abaixo da topbar.

- `organization_asset_navigation` persiste ordem e ícones por empresa com RLS e grants somente service_role. `asset-navigation` define payload estrito e catálogo fechado; layout lê pela empresa da sessão, PUT /api/settings/asset-navigation exige dono cliente e ignora qualquer tentativa de escolher organização no payload. Sem localStorage nem modificação de documentos/categorias.

- Layout incorpora categories persistidas às pastas dos ativos, inclusive vazias. Chaves estáveis conservam endereço e preferências depois de renomear.
