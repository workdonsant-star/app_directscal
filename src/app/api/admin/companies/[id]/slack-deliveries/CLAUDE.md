# Entregas Slack por empresa

GET lista metadados paginados sem texto de conversa ou token. POST reprocessa somente falhas confirmadas, exige ID/updatedAt e sessão definitiva superadmin. Empresa/ator vêm de rota/sessão, revalidados no banco. Envio incerto não é reenviável. No-store, erros seguros. A fila de supervisão consome este endpoint.
