# `/action-points` — Action Points

## Propósito

Painel de acompanhamento dos action points que o gestor Directscal seleciona e publica na entrega do cliente. Aparece na sidebar como `Action Points`. `/gantt` é só um redirecionamento legado. Não é uma agenda: prazo/cadência são colunas, não um calendário.

**Render anterior (substituído pela integração publicada em 19/10/2026):** a página mostra a **visão por responsável**, com foto e anel de aderência primeiro; ao expandir a pessoa, mostra iniciativas (ativos de gestão) e action points, com a aderência de cada ativo mantida pelos líderes. Componentes em `src/components/action-points/` e dados fictícios em `src/lib/data/action-points-adherence-example.ts`. A faixa representa manutenção (pode cair), não progresso rumo a concluído; `Aguardando` e `Parado` são estados próprios. Ver seção 18 de `docs/experiencia-agentica-projetos-e-action-points.md` e `src/components/action-points/CLAUDE.md`.

**Caminho de dados reais (ativo desde 19/10/2026):** `getPublishedActionPointsWorkspace()`, `getActionPointExecution()` e `src/components/gantt/ActionPointsWorkspace` continuam no repositório para religar quando o backend de ativos/aderência/agente existir. A validação do `PATCH /api/action-points` ainda usa `getPublishedActionPointsWorkspace()`. Não apagar esse caminho sem nova decisão.

A direção do produto é que a execução e o acompanhamento da aderência sejam conduzidos pelo agente no Slack (perguntar ao líder sobre reuniões, feedbacks e alinhamentos; atualizar a aderência a partir da resposta). O agente ativo ainda não existe.

## Convenções locais

- A rota pertence à aplicação do cliente e redireciona `superadmin` para `/admin/operacao`.
- Fontes das ações: `getPublishedActionPointsWorkspace()` conserva a entrega publicada mais recente dos diagnósticos autorizados; `getCustomerCompanyActionPoints()` lê os cadastros manuais das organizações com membership vigente. Sem `?diagnostico`, ambos podem aparecer, em seções separadas. Com `?diagnostico`, a rota mantém somente a coleta selecionada. Sem nenhuma ação, mostra o estado vazio, sem dados de demonstração.
- Estado de execução (responsável, etapa, início, prazo, cadência e histórico): `getActionPointExecution()` (`action-point-execution-data-source.ts`), sempre filtrado pela empresa da entrega.
- Edição: somente o Superadmin da empresa (`cliente`), via `PATCH /api/action-points`. O papel `admin` da empresa vê a página, sem o formulário.
- Responsável: escolhido numa lista ao vivo das pessoas do Slack (`GET /api/action-points/slack-users`). Só a referência do Slack e um registro de nome e foto são gravados. Sem Slack conectado, ou com instalação anterior às permissões `users:read` e `im:write`, o painel orienta a conectar ou reconectar em `/configuracoes`.
- A página calcula o status do Slack no servidor (`desconectado`, `reconectar`, `conectado`) e a data de hoje no servidor, para não divergir na hidratação.
- Estrutura: `AppTopbar` (título `Action Points`, sem breadcrumb) e `AppPage` com largura total. Sem `Card` em volta da tabela.
- Lista, abas, agrupamento e painel de detalhes: `src/components/gantt/CLAUDE.md`.
- A cadência fica gravada, mas ainda não dispara nada. Não prometa acompanhamento ativo na interface antes do agendador e da mensagem privada existirem.
- Mantenha `Action Points` como item independente da sidebar; não promova para módulo próprio sem nova decisão explícita.

A visão por pessoas foi escolhida como padrão em `/action-points`. O link Versão 2 foi removido da topbar; `/action-points/v2` permanece compatível com a mesma visão. O componente anterior por ativo continua preservado no repositório. Regras e limites em `v2/CLAUDE.md`.


Desde 19/10/2026, a rota normal usa somente a seleção publicada e suas atribuições reais, mantendo a apresentação por pessoa. ?diagnostico conserva a coleta ao vir do relatório; sem parâmetro escolhe a publicação autorizada mais recente. Sem publicação, mostra vazio. Sem medição recorrente, não inventa percentual, ciclos ou conversa. A rota v2 reexporta a mesma página. A direção proativa permanece pendente.

A04: acordos publicados aparecem abaixo da lista, mediante autorização RLS do diagnóstico e RPC privada com membership. Sem acordos o bloco não renderiza. A mesma leitura atende /v2. Responsável com acordos só muda pela transferência da operação, preservando todas as rotinas e histórico.


A06: a página lê execução/acordos/registros em paralelo após resolver a publicação autorizada. Resumo real soma oportunidades explícitas vencidas dos últimos trinta dias; não usa média de percentuais nem meta ilustrativa. Timeline existente recebe somente mensagens registradas, com contexto do ciclo; acordo mostra relato integral, evidência, confirmação e revisões. Sem ciclos mantém ausência de base. Ver docs/conversa-de-execucao-rotinas.md.

O botão Baixar Action Points ocupa as actions da AppTopbar, somente quando há fonte publicada. Preserva o diagnosticId da coleta; não há download duplicado nem link Voltar ao relatório no corpo. /v2 herda a mesma composição.

Os action points manuais cadastrados pelo consultor são visíveis na página principal do cliente pelo mesmo `ActionPointsPeopleView` da demo: resumo, tabela por pessoa, expansão e painel lateral. Sem execução real, o resumo e a tabela informam ausência de medição; o painel mostra ativo, prazo/frequência e os textos cadastrados. A leitura filtra as organizações acessíveis antes de usar service role; não atribui aderência, check-ins ou conversas a ações sem acompanhamento. Eles não entram no PDF da entrega, que continua vinculado à coleta publicada.

Após uma pergunta manual entregue pelo agente, o painel mostra a pergunta e aguarda 24 horas pela resposta. Sem resposta registrada após esse prazo, a pergunta recebe a badge vermelha `Não respondido`; antes disso, `Aguardando resposta`. Resposta de execução declarada confirmada recebe `Validado`, e pergunta da pessoa recebe `Dúvida`, sempre junto do texto literal do Slack. O resumo mede execução relatada nas perguntas entregues nos últimos 30 dias que já tiveram relato confirmado ou estão pendentes há pelo menos 24 horas. Somente relato `executado_relato` confirmado conta no numerador; `parcial` confirmado aparece à parte. Pergunta recente sem confirmação fica fora da base. Sem base não há percentual. A taxa não afirma execução comprovada.

A trilha manual exibe todas as mensagens vinculadas ao acompanhamento: pergunta inicial integral, respostas da pessoa, respostas do agente com entrega confirmada e confirmações posteriores. Mensagens na thread também aparecem quando não produziram um relato classificado. A associação exige empresa, workspace, pessoa e canal compatíveis; mensagens de DM sem vínculo inequívoco não são atribuídas à ação.
