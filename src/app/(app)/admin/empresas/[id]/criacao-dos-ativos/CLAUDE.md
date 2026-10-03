# Criação dos ativos — instância da empresa

## Rotas

- `/admin/empresas/[id]/criacao-dos-ativos`: ativos da organização desta empresa, com estados editoriais e drawer de criação.
- `/admin/empresas/[id]/criacao-dos-ativos/[assetId]`: editor, revisão, publicação e histórico. Retorna 404 se o ativo não pertencer à empresa da URL.
- `/admin/empresas/[id]/criacao-dos-ativos/perguntas`: auditoria do agente restrita à organização, antes do limite de resultados.

## Convenções

- O ID da instância é `company_<organizationId>`, contrato existente das empresas. Resolver a organização no servidor antes de carregar ativos.
- A empresa é fixa e o drawer não permite trocá-la. A criação envia o organizationId da instância.
- O conteúdo mantém o ciclo rascunho → em revisão → pronto para publicar → publicado; versões publicadas permanecem imutáveis.
- A biblioteca do cliente continua em `/ativos-de-gestao/*`.
- Operação possui apenas a seleção de empresa; nenhuma produção acontece na listagem global.
