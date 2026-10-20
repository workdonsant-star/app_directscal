# Operação das rotinas

Workspace administrativo por empresa para criar/adaptar um acordo de ação publicada, vincular pergunta/ativo/setor, atribuir pessoa ativa do Slack, pausar/retomar e transferir todas as rotinas da ação. Formulários usam Select do sistema e tabela operational. Nenhum percentual é inferido. Erros de gravação preservam o formulário; histórico mostra revisões imutáveis. Dados vêm de props/API autenticada, nunca Supabase no cliente.

A05: configuração de acompanhamento em Sheet (público ativo, dias, horário/fuso e limites), desativada por padrão; formulário conserva campos em conflito. Setores inativos saem da nova seleção com aviso. Rotina por evento oferece diálogo de ocorrência explícita com prova, identificador e prazo, condicionado à política. Nenhum componente chama Slack diretamente. Cadência diária explicita segunda a sexta; detalhes das convenções no documento do agente proativo.


A07: routine-review-panel reutiliza tabela operational, Dialog e RoutineChoice. Exibe fila por ciclo, critério/evidência, aprovar/devolver, exceção, orientação e prazo de retorno em São Paulo. Erros preservam texto; gravação seguida de falha de leitura é informada como gravada. Política de contato explica o lembrete único de 24h e escalonamento interno em 48h. Revisão visual desta mudança permanece pendente.


A10: routine-results-panel mostra base de coleta por pergunta/camada e versão do ativo, captura explícita de acordo antigo e ausência de estimativa. Dados iniciais no servidor; atualização própria revalida acesso. Não expõe essas bases no cliente nem infere melhoria por execução. Revisão visual pendente.
