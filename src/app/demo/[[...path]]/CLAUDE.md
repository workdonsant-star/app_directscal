# Rotas da demo

As rotas legadas `/demo/insights/[dimensao]` redirecionam para a aba da dimensão em `/demo`; o Analytics da apresentação usa as mesmas 30 afirmações do instrumento e não mantém páginas individuais de dimensão.

O catch-all monta páginas públicas da apresentação com componentes do produto e fixtures locais. Rotas desconhecidas retornam 404. Avatares das lideranças vêm de `demoBoard` e `demoSectors`; o agente usa a foto padrão do perfil principal. A navegação e os downloads permanecem em `/demo`.

`/demo/relatorios` lista apenas PDFs enviados pelo superadmin fictício na aba Relatório da empresa. A antiga prévia HTML específica foi retirada.

Páginas raiz da demo, incluindo `/demo/relatorios` e `/demo/admin/guia`, deixam a topbar sem nome e sem breadcrumb. Detalhes de empresa, ativo e relatório preservam trilhas com pelo menos dois níveis.
