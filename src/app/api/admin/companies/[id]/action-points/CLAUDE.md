# Action points manuais por empresa

GET devolve os registros da operação, ativos publicados e diretório Slack da empresa. POST cria ou atualiza com versão esperada. Ambos exigem sessão definitiva de superadmin; organização e ator vêm da rota e da sessão. Nenhuma escrita ativa o agente ou envia mensagens.

PUT com `actionPointId` inicia explicitamente um teste de acompanhamento no Slack. Exige o mesmo acesso administrativo e revalida pessoa ativa, versão publicada do ativo e motor de IA. GET inclui o último ciclo e os relatos estruturados para a aba da empresa. POST de cadastro continua sem envio.
