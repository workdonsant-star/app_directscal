# `src/app/(app)/admin` — Superadmin

Antes de editar, releia o **AGENTS.md** da raiz e `src/app/CLAUDE.md`.

## Propósito

Rotas autenticadas da visão de superadministrador. Usam a mesma shell do app (`AppSidebar`, `AppTopbar`, `SidebarInset`), mas a sidebar muda para navegação administrativa quando o pathname começa com `/admin`.

## Rotas

- `/admin` redireciona para `/admin/empresas`.
- O loading da raiz administrativa reutiliza o skeleton da lista de empresas, destino do redirecionamento.
- `/admin/demo` oferece ao superadmin atalhos para a apresentação pública isolada, sem acesso aos dados do cliente.
- `/admin/perfil` permite ao superadmin editar o próprio nome e foto persistidos, pelo menu do usuário.
- `/admin/motores-de-ia` configura conexões reais Anthropic, OpenAI e Google Gemini e escolhe uma alternativa para o agente de consulta.
- `/admin/geradores/[tipo]` oferece os briefings de contratos, diagnósticos, documentos gerais, propostas e SOPs. Diagnósticos também aceita o CSV de respostas, calcula notas por pessoa e grupo e oferece rascunho editorial local para revisão e download. Os demais formulários montam apenas Markdown de briefing. Não chamam IA nem persistem documentos.
- `/admin/operacao` concentra indicadores e a fila de entregas.
- `/admin/especialistas` lista e cadastra especialistas internos em estado local.
- `/admin/operacao/criacao-dos-ativos` redireciona para `/admin/empresas`; toda produção, edição, revisão, publicação e auditoria fica em `/admin/empresas/[id]/criacao-dos-ativos` e suas subrotas.
- `/admin/campanhas` lista e configura campanhas de aquisição.
- `/admin/leads` lista leads capturados.
- `/admin/leads/[id]` mostra o detalhe completo de um lead capturado.
- `/admin/empresas` lista organizações com conta cliente criada. Leads sem conta não entram na listagem.
- `/admin/empresas/[id]` mostra o Analytics da organização, com os mesmos componentes e cálculos do cliente. As abas visíveis da empresa são Visão geral, Arquivos e Action points; Arquivos oferece envio em modal. Action points lista ações já publicadas e leva ao acordo operacional existente. `/admin/empresas/[id]/operacao` e `/rotinas` permanecem como rotas antigas acessíveis por URL.
- `/admin/entregas/[id]` redireciona para `/dados` e reúne, em rotas aninhadas, dados, relatório, action points, ativos e publicação.
- `/admin/modulos` permanece como rota legada para o catálogo, fora da navegação principal.

## Convenções

- Usar `AppPage` com o mesmo recuo horizontal de Dimensões (`px-6 lg:px-10`) e conteúdo em largura total, sem `max-width` ou centralização adicional.
- Manter continuidade visual com `/omdx/diagnosticos`: páginas de listagem do admin devem renderizar tabelas livres, sem card/box externo envolvendo a tabela.
- Campanhas, Empresas, Leads (lista e detalhe) e Módulos recebem snapshot real no servidor via `getAdminPageSnapshot`, depois de autorizar a sessão. `/api/admin/acquisition` serve somente revalidação após mutações. Não usar seeds como carregamento ou fallback de erro.
- Campanhas e leads ficam disponíveis quando `FEATURE_ACQUISITION=true`; Empresas cadastradas permanece acessível ao superadmin independentemente do flag.
- Rotas `/admin/*` exigem role `superadmin`; usuários `cliente` devem ser redirecionados para `/omdx`.
- A navegação do `superadmin` não oferece links para a aplicação do cliente. O papel administrativo não pode abrir páginas, downloads ou APIs de Maturidade; toda operação privilegiada permanece em `/admin/*` e `/api/admin/*`.
- Páginas raiz abertas pela sidebar administrativa não exibem breadcrumb. Nas rotas da empresa, inclusive abas, editor de ativos e perguntas, o breadcrumb termina em `Empresas / Nome da empresa`; a aba e o conteúdo indicam a área atual.

## Navegação administrativa

- `Demo` não aparece na sidebar; a apresentação permanece acessível pela rota `/admin/demo`. `Empresas cadastradas` continua na seção Empresas, `Especialistas` fica em Equipe, os cinco geradores e `Motores de IA` ficam em Agentes, e `Campanhas` em Aquisição.
- Leads e Entregas não aparecem na sidebar. Suas rotas existentes continuam acessíveis por links contextuais ou URL legada; o fluxo de ativos não passa por elas.
- A primeira versão de Operação usa mocks tipados e estado local; não deve simular persistência ou ampliar acesso do `superadmin` ao app do cliente.


A11: Empresas lê atribuição principal e histórico real pela RPC privada por organização. A fila de Operação usa os mesmos estados, incluindo revisão privada e sugestão principal. O cadastro de especialistas é persistido; a orientação antiga de mocks não se aplica a esses caminhos.

A04: /admin/empresas/[id]/rotinas exige sessão definitiva superadmin, usa connection() e consulta o workspace autorizado no servidor. Expõe criação/adaptação, pausa/retomada, transferência e histórico. JSX fica fora de catch; erro desconhecido não vira 404 silencioso.

C2: /admin/guia apresenta o procedimento operacional, acessível pelo detalhe da empresa. O detalhe inclui consulta/recuperação das entregas Slack via API administrativa existente; nenhuma agenda externa é ativada por abrir o painel.
