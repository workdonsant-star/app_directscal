# `/omdx/[id]/respostas` — Exportação de respostas

Route Handler autenticado que exporta as respostas concluídas de uma pesquisa em CSV, sem depender de relatório publicado ou score consolidado.

- Reutiliza `getDiagnosticById` para validar acesso à coleta e nega superadmin global.
- Consulta sessões, respostas e perguntas somente no servidor; pagina as leituras para não truncar coletas grandes.
- Cada linha contém uma nota por pergunta, com número sequencial da resposta, grupo, data, dimensão e texto da pergunta. Não exporta nome, e-mail, token, IP ou identificador persistente do respondente.
- Retorna attachment UTF-8 com BOM, separado por ponto e vírgula, sem cache. Células textuais são escapadas contra fórmulas de planilha.
