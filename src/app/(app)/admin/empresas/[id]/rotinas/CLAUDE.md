# Operação das rotinas da empresa

Página exclusiva de superadmin. Ator vem da sessão e empresa de company_<UUID>. Lê acordos, origem publicada, versões, pausa e histórico via fonte administrativa. Não acessa dados da aplicação do cliente por sessão privilegiada. Interface usa tabela operacional e formulários laterais; nenhuma mensagem ao Slack é enviada ao salvar.

A05: página lê política de contato em paralelo ao workspace autorizado e injeta dados iniciais do formulário. Nenhum carregamento ativa política ou agenda contatos. Configuração e ocorrência usam APIs distintas, mantendo a empresa da rota.


A07: página carrega fila de revisão em paralelo ao workspace/política, com snapshot de horário para renderização consistente. routine-review-panel mostra pendências por ciclo e decisão com motivo/revisão/tentativa, preservando formulário em conflito. Decisões aparecem no cliente; não presumir entrega de orientação pelo Slack.


A10: carrega baselines privados autorizados em paralelo e injeta na seção Base de resultado. Carregamento não captura bases antigas nem inicia novas conversas.
