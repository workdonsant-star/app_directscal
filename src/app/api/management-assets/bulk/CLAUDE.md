# Alteração em lote pelo dono

PATCH valida sessão cliente definitiva, IDs únicos (1–1000) e changes estrito de type/categoryKey. Empresa e ator não vêm do payload. Data-source resolve as pastas da organização e chama RPC privada atômica. Sem exclusão ou alteração de conteúdo. Erros de autorização/conflito são tratados; erros internos não vazam.
