# Operação por empresa

PATCH `/api/admin/companies/[id]` persiste o especialista principal. Exige sessão superadmin e payload estrito com especialista e versão esperada; empresa vem do ID da rota e ator da sessão. RPC revalida papel, empresa e especialista ativo, serializa alterações e retorna 409 em conflito. Não reatribui entregas publicadas ou rascunhos existentes; principal é sugestão para uma nova entrega. Falhas não expõem banco.

DELETE `/api/admin/companies` exige superadmin definitivo, FEATURE_ACQUISITION, origem compatível e payload estrito de 1–100 companyIds únicos + confirmação EXCLUIR. Ator vem da sessão. A data-source chama uma única RPC privada para todo o lote; erros não expõem detalhes do banco. A migração deve estar aplicada antes de disponibilizar a exclusão.
