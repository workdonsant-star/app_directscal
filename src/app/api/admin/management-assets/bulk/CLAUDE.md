# Operações em massa

PATCH altera somente os metadados enviados; DELETE exclui os ativos selecionados e seus dependentes pelas FKs existentes. Ambos exigem superadmin, organizationId UUID e 1 a 200 IDs únicos. A seleção inteira é validada antes da escrita e toda escrita repete o filtro de empresa e IDs. PATCH recusa arquivados e autores fora do catálogo. Não modifica conteúdo nem versões publicadas. A resposta retorna os IDs efetivamente afetados para tratar concorrência sem anunciar sucesso dos demais. Não executar exclusões de dados reais durante a validação da interface.
