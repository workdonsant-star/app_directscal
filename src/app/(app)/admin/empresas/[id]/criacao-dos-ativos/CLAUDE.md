# Criação dos ativos — instância da empresa

## Rotas

- `/admin/empresas/[id]/criacao-dos-ativos`: ativos da organização desta empresa, com estados editoriais e escolha compacta de categoria e tipo.
- `/admin/empresas/[id]/criacao-dos-ativos/[assetId]`: editor, publicação direta e histórico. Retorna 404 se o ativo não pertencer à empresa da URL.
- `/admin/empresas/[id]/criacao-dos-ativos/perguntas`: auditoria do agente restrita à organização, antes do limite de resultados.

## Convenções

- O ID da instância é `company_<organizationId>`, contrato existente das empresas. Resolver a organização no servidor antes de carregar ativos.
- A empresa é fixa. O diálogo exige categoria (inclusive escolha explícita de Sem categoria) e abre o editor ao clicar no tipo. Não há formulário de metadados antes da edição.
- O conteúdo mantém o ciclo rascunho → publicado; versões publicadas permanecem imutáveis. Uma nova edição cria outro rascunho sem retirar a publicação vigente.
- A biblioteca do cliente continua em `/ativos-de-gestao/*`.
- A aba `Arquivos` oferece `Nova pasta` e `Novo arquivo` lado a lado. A raiz mostra pastas; abrir uma pasta revela uploads e ativos editoriais existentes, com acesso ao editor. A tabela e o botão `Novo ativo` não aparecem nesta aba.
- O cabeçalho também mostra a aba Action points para a mesma organização, usando `AdminCompanyTabs`. A lista real dos pontos publicados fica em `/admin/empresas/[id]/action-points`.
- O envio aceita PDF/DOCX para ativos e PDF para relatórios e publica imediatamente para a empresa da URL. As pastas usam `organization_asset_navigation.preferences.categories` e aparecem na sidebar do cliente, inclusive vazias. Relatórios enviados aparecem em uma pasta própria.

- Opções de autores vêm de specialists no Supabase; somente especialistas ativos, não arquivados e não excluídos podem receber novas atribuições.


A17: perguntas carrega histórico completo e operações autorizadas por empresa; inclui responsável, encerramento/evidência e saúde real da fila. Sem teto silencioso de 200 perguntas.
