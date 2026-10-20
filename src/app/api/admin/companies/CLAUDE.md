# Operação por empresa

PATCH `/api/admin/companies/[id]` persiste o especialista principal. Exige sessão superadmin e payload estrito com especialista e versão esperada; empresa vem do ID da rota e ator da sessão. RPC revalida papel, empresa e especialista ativo, serializa alterações e retorna 409 em conflito. Não reatribui entregas publicadas ou rascunhos existentes; principal é sugestão para uma nova entrega. Falhas não expõem banco.
