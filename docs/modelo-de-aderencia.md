# Modelo de aderência — base implementada em 20/10/2026

O escopo confirmado distingue conhecimento/uso, execução e resultado. A base abaixo conserva essa separação e não altera a experiência publicada do cliente. Não gera estimativa de impacto, não envia mensagens e não agenda ciclos automaticamente.

## Acordo e oportunidade

Uma rotina tem identidade estável e revisões sequenciais imutáveis. Cada revisão vincula empresa, diagnóstico e ação publicada, pergunta do mesmo questionário, ativo e versão vigente publicada, setor, pessoa do Slack já atribuída à ação e expectativa escrita. Um novo acordo exige vínculos válidos no momento da criação. Uma nova revisão conserva os ciclos anteriores com seu responsável, setor e versão originais.

A regra informa periodicidade diária, semanal, quinzenal, mensal, trimestral, semestral ou anual, ou a chave de um evento verificável. O fuso inicial é America/Sao_Paulo. Uma oportunidade tem chave própria, abertura e prazo explícitos. A mesma rotina/chave não pode produzir dois ciclos, mesmo após transferência ou nova revisão do acordo. Novos ciclos usam a revisão vigente.

O gerador de calendário, feriados, suspensão e obtenção de eventos reais pertencem a A04/A05. Esta base não presume que um evento ocorreu nem cria denominador a partir do número de consultas, da passagem do tempo ou do progresso de implantação. Qualquer alteração de calendário deve conservar o acordo e os ciclos anteriores.

## Registros separados

| Registro | O que conserva | Efeito no cálculo |
| --- | --- | --- |
| Leitura confirmada | Registro do ator autenticado sobre o ciclo | Contagem de leitura, sem promover execução |
| Execução relatada | Relato positivo/negativo e referências HTTPS de evidência | Relato positivo entra somente no numerador relatado |
| Evidência revisada | Referência ao relato vigente, decisão e justificativa | Numerador validado exige relato positivo, evidência e aprovação explícita |
| Exceção solicitada | Motivo da ausência de oportunidade | Não altera denominador |
| Exceção revisada | Solicitação vigente, decisão e justificativa | Aprovação exclui a oportunidade; recusa posterior a inclui novamente |
| Resultado registrado | Indicador, linha de base, observação, unidade, fonte e justificativa | Conta observações de resultado; não determina sucesso nem impacto causal |

Os registros são adicionais e não editáveis. A última revisão válida do relato/solicitação vigente governa o cálculo; um relato novo exige nova validação. Cada tentativa possui UUID idempotente. Reenvio idêntico conserva ID, sequência e horário; reutilização com outro conteúdo é conflito 409. A transação serializa registros do mesmo ciclo sem conceder UPDATE/DELETE às tabelas imutáveis.

O ator registrado é a conta do painel que realizou a atestação manual. Isso não comprova autoria da pessoa do Slack nem consulta à versão; A06 deve registrar origem, identidade verificada e recibo do transporte antes de aceitar respostas externas como autoria da pessoa. Nenhum canal é personificado por esta base.

## Numerador e denominador

O período é uma janela de prazos [início, fim), com instante de apuração explícito. Prazo igual ao instante de apuração já entra na base. Ciclos futuros aparecem como previstos, sem entrar nos percentuais. Fatos posteriores à apuração ficam fora da leitura histórica.

- Previstos: ciclos com prazo alcançado no período.
- Excluídos: previstos com exceção explicitamente aprovada.
- Elegíveis: previstos menos excluídos.
- Execução relatada: ciclos elegíveis com último relato positivo / elegíveis.
- Execução validada: ciclos elegíveis com evidência aprovada para o último relato positivo / elegíveis.
- Sem relato: elegíveis sem relato positivo. Ausência de resposta mantém a oportunidade no denominador.
- Aguardando validação: elegíveis relatados e ainda sem validação aceita.

Sem elegíveis, ambos os percentuais são null. Não há nota geral que misture leitura, relato, evidência e resultado. Agregados por pessoa (workspace + user ID), ativo e setor somam os mesmos numeradores/denominadores; não calculam média de percentuais. Dados de outra empresa são excluídos e inconsistências persistidas interrompem a leitura em vez de virar zero.

## Persistência e acesso

`app_private.asset_adherence_rules`, `asset_adherence_cycles` e `asset_adherence_facts` têm RLS, sem grants a anon/authenticated. Service role possui somente SELECT/INSERT; não há UPDATE/DELETE. Funções são invoker, search_path vazio e espera de lock de 5 s. Índices cobrem FKs e leitura por empresa/período.

`asset-adherence-data-source.ts` valida contratos e ator, cria acordos/oportunidades, registra fatos pela RPC e lê todas as páginas. Não há endpoint novo exposto ao navegador. Consumidores futuros devem resolver empresa/ator pela sessão, nunca aceitar esses campos de um formulário. Escritas operacionais e revisão visual da configuração pertencem a A04; ingresso do Slack, a A06.

## Verificação

Testes unitários verificam camadas, base ausente, futuras oportunidades, exceção/recusa, revisão desatualizada, duplicação, período e agrupamentos. A fonte de dados verifica autorização, escopo, paginação de 1.001 oportunidades, inconsistência e erro sem detalhes privados.

`supabase/tests/asset-adherence-model.sql` verifica vínculos, origem publicada, responsável divergente, regra sem fuso, ciclos duplicados entre revisões, isolamento, reentrada, conflito de conteúdo, relato sem evidência e revisão antiga. Executado com ROLLBACK, incluindo chamada com o papel service_role. A migração foi aplicada ao OMDx. Teste integrado adicional usa fixtures descartáveis e as funções reais da data-source; o resultado fica registrado no fechamento operacional e no CRM.

## A04 — início da operação

Pausa/retomada já persistem em histórico privado imutável, com ator DirectScal, motivo, versão esperada e reentrada. Novas oportunidades respeitam a pausa sob o mesmo lock transacional. Ciclos abertos continuam na base e aceitam registro de evidência; pausa não aprova exceção. A operação em `/admin/empresas/[id]/rotinas` cria/adapta acordos com origem, ativo/versão, pergunta, setor, expectativa e indicador. A transferência une todas as revisões vigentes e atribuição na mesma transação, com recibo idempotente e snapshot esperado completo. Um trigger diferido impede divergência por outro caminho. Ciclos existentes preservam a revisão original. A leitura adicional do cliente exige acesso ao diagnóstico via RLS e membership na RPC, restringindo acordos à seleção publicada. Revisão visual do painel global e transferência real entre duas pessoas continuam pendentes; criação, conflito, pausa e leitura cliente têm evidência integrada local.
