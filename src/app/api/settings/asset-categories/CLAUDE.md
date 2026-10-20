# Categorias da biblioteca

POST cria pasta persistida vazia; PATCH renomeia por chave estável. Sessão cliente definitiva, organização e ator do servidor. Payload estrito title/key. RPC privada revalida dono, recusa nomes duplicados e preserva preferências; renomeação dos ativos e registro são atômicos. Não altera conteúdo, versões ou permissões.

GET ?key consulta contagem real de documentos de todos os estados, com dono e empresa revalidados. DELETE recebe key e destinationKey ou newTitle (mutuamente exclusivos). Categoria vazia dispensa destino; RPC impõe a regra novamente na gravação, verifica título atual e destino distinto. Nenhum documento é excluído. Falhas são saneadas; respostas sem cache.
