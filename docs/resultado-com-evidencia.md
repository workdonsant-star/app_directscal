# Resultado com evidência — A10

Base técnica parcial de 20/10/2026. Estimativa e coleta de percepção continuam bloqueadas pelas decisões de rubrica e privacidade A16; não há autorização implícita para contatar mais pessoas.

## Linha de base implementada

Cada revisão de acordo mantém pergunta, diagnóstico, action point, ativo e versão. Ao criar acordo de coleta encerrada, uma captura imutável registra texto da pergunta, encerramento disponível e data real da captura, com média e número de respostas por Fundador, Liderança e Time. Inclui apenas respostas concluídas; grupo sem respostas tem score nulo, sem nota padrão. Não copia sessão individual, nome ou identificação de respondente.

Acordo antigo sem snapshot pode ser capturado explicitamente pela operação. A captura é feita agora: não deve ser apresentada como evidência de que o snapshot já existia na data da publicação. Reentrada não atualiza os valores. Nova revisão guarda novo vínculo/versionamento. A base fica privada; esta entrega não abre novos agregados ao cliente antes de aprovar a política de públicos.

A seção Base de resultado aparece no workspace administrativo de rotinas. Endpoints exigem superadmin definitivo; empresa e ator vêm da rota/sessão. RPC privada de captura conserva compatibilidade com ator dono já autorizado nos acordos legados, sem grants de cliente ou rota de cliente. Leitura privada permanece global. Captura automática de legado ainda não encerrado é omitida; captura manual recusa até encerramento.

## Estado da estimativa

O cliente não recebe uma nota extraída de relato de execução, leitura, uso ou progresso. Estado sem metodologia/base: sinal insuficiente. Aprovar evidência de execução em A07 não aprova estimativa de maturidade. A03 resultado_registrado é indicador operacional com baseline/observado/fonte; não corresponde à escala Likert da pesquisa.

A rubrica precisa ter cinco âncoras comportamentais específicas para cada pergunta (1–5), exemplos de evidência válida e inválida, janela temporal, público e composição da amostra, tratamento de sinais contraditórios e confiança. Não basta converter percentual de execução em nota.

## Decisões necessárias para continuar

1. Aprovar A16: públicos, mínimo por camada/recorte, proteção por subtração, evidências identificadas e retenção. A proposta anterior de três pessoas em analytics-impacto.md não é regra aprovada e deve ser conciliada com a proposta atual de cinco.
2. Escolher perguntas/públicos do piloto e confirmar cinco âncoras por pergunta; informar quais sinais demonstram melhoria e quais apenas execução.
3. Definir executor e pessoas afetadas separadamente, cobertura, divergência e janela; decidir o que torna confiança insuficiente. Amostra de conveniência e repetição da mesma pessoa não viram população representativa.
4. Nomear revisor humano inicial e condição de aprovação. Recusa/devolução conserva motivos e evidências; não publicar estimativa pendente.
5. Aprovar apresentação da origem, data e confiança e o aviso de que estimativa não substitui coleta. Conversa identificada não deve chegar aos charts.
6. Na coleta posterior comparável, manter pergunta/camada/escala/população/período identificáveis e congelar estimativa anterior à coleta. Calcular erro absoluto e diferença assinada contra a nota real; não reescrever previsão após ver o resultado. Mudança de questionário/população precisa de ressalva ou suspensão da comparação.

## Desenvolvimento que permanece após essas decisões

Persistência/versionamento da rubrica aprovada e política, coleta de percepção autorizada (sem misturar respostas anônimas), classificação com evidência, proposta/revisão/publicação de estimativa e calibração posterior ainda precisam ser implementadas. Não estão disfarçadas como funcionalidades concluídas. A10 fica bloqueada com a linha de base entregue e estes itens encadeados às decisões do responsável.

## Validação

SQL fictício com ROLLBACK verificou captura automática, média e contagem, grupos sem resposta, vínculo de versão/pergunta, ausência de sessão individual no snapshot, idempotência imutável, tenant, papel e grants. Regressões A03/A04 passaram após o novo trigger. Verificação visual e produção continuam pendentes.
