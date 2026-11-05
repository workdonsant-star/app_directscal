# Action points manuais por empresa

GET devolve os registros da operação, ativos publicados e diretório Slack da empresa. POST cria ou atualiza com versão esperada. Ambos exigem sessão definitiva de superadmin; organização e ator vêm da rota e da sessão. Nenhuma escrita ativa o agente ou envia mensagens.
POST exige dias e horário para recorrências novas ou editadas. A agenda é executada apenas pela rota interna autenticada; salvar não envia mensagem imediatamente.

PUT com `actionPointId` inicia explicitamente um teste de acompanhamento no Slack. Exige o mesmo acesso administrativo e revalida pessoa ativa, versão publicada do ativo e motor de IA. GET inclui o último ciclo e os relatos estruturados para a aba da empresa. POST de cadastro continua sem envio.

Um ciclo `enviado` não impede nova pergunta: cada acionamento cria um ciclo e uma thread distintos. O índice único permite apenas um envio em `preparado`/`enviando` por action point, e `incerto` continua impedido pela verificação server-side.
