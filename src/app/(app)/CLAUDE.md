# Shell autenticado

Leia `src/app/CLAUDE.md` e `AGENTS.md`. O layout resolve sessão/empresa e compõe SidebarProvider, AppSidebar e SidebarInset. O escopo de iniciativas é `<userId>:<primaryOrganizationId>`, com fallback local somente para sessão demo.

O shell do frame 242:267 usa `app-shell`, `bg-shell`, sidebar/topbar contínuas e conteúdo com raio de 20px via globals.css. Topbars ficam fora da superfície arredondada. As páginas continuam responsáveis por AppTopbar e AppPage. Rotas de domínio preservam suas regras de autorização; novas iniciativas e áreas de ativos rejeitam superadmin.
