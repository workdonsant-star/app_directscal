# Experiência agêntica — Projetos e Action Points

Data: 04/10/2026. Branch consultada: `symbach`.

Status: especificação funcional com decisões de produto confirmadas pelo usuário e implementação frontend da interface de projetos escolhida na versão 2 (seção 15), com progresso em linha do tempo e tomada de decisão do líder (seção 17). Integrações e permissões permanecem como antes; tarefas reais e acompanhamento proativo ainda não foram implementados. O perfil prioritário foi escolhido pelo usuário: **gestor que acompanha projetos e destrava a equipe**. O **acompanhamento proativo de tarefas pelo agente, com conversa no Slack e atualização da ferramenta de gestão**, é uma capacidade requerida para a visão do produto, ainda não implementada.

**Fluxo central confirmado: acompanhar prazos → conversar com o executor no Slack → confirmar a entrega → registrar e ajustar a tarefa → refletir em Projetos e Action Points.**

- O agente verifica as tarefas periodicamente durante o dia e inicia o contato conforme o prazo se aproxima.
- O executor informa o andamento e confirma o horário de conclusão ou solicita um novo horário.
- O agente registra a resposta em um comentário na tarefa e atualiza o prazo conforme a autonomia configurada, preservando o compromisso anterior no histórico.
- Projetos mostra o acompanhamento coletivo; Action Points mostra a tarefa do executor e eventuais decisões dirigidas ao gestor, sobre o mesmo registro.
- O acompanhamento continua após a atualização. Confirmar uma previsão não significa concluir a tarefa.

O detalhamento desse requisito, das exceções e dos reflexos na interface está nas seções 6.1, 6.2 e 6.3. As etapas de implementação da seção 12 já contemplam o acompanhamento proativo junto à execução assistida.

## 1. Resultado esperado

O gestor deve conseguir entender o estado dos projetos, identificar onde precisa intervir e resolver o trabalho cotidiano pela DirectScal. ClickUp, Notion ou Monday mantém os registros operacionais na conta do cliente. O agente conecta execução, procedimentos e comunicação dentro do contexto que a pessoa pode acessar.

O objetivo de usabilidade é reduzir o trabalho necessário para gerir a operação: localizar uma pendência, recuperar seu contexto, decidir e registrar a decisão. Ter um chat ou integrar uma ferramenta, isoladamente, não demonstra esse resultado.

Decisão confirmada pelo usuário: o agente também inicia o acompanhamento, sem depender de uma pergunta ou menção. Ao longo do dia, verifica os prazos das tarefas conectadas, conversa com o executor quando a entrega se aproxima, confirma a previsão de conclusão e registra o resultado na ferramenta do cliente. Projetos e Action Points apresentam esse acompanhamento conforme o contexto e a responsabilidade de cada pessoa.

## 2. Ponto de partida verificado antes do protótipo

| Área | Ponto de partida | Distância para a visão proposta |
| --- | --- | --- |
| Iniciativas | Lista e formulário com nome, tipo, objetivo, responsável, prazo e status. Armazenamento no navegador por usuário e empresa. | Não reúne tarefas, não colabora entre pessoas e não representa projetos conectados. |
| Action Points | Calendário semanal de recomendações provenientes do plano do diagnóstico mais recente; fallback de apresentação quando não há plano. | Não é uma caixa individual de tarefas atribuídas ao usuário externo. Responsáveis são rótulos operacionais, não vínculos de identidade entre plataformas. |
| Agente | Consulta ativos publicados da empresa, com citação ou recusa. | Ainda não consulta nem altera tarefas de projetos. Histórico da tela não permanece entre sessões. |
| Slack | Consulta pelo bot em menções, mensagens diretas e continuação de threads em que o bot participa. | Esse fluxo não implementa acompanhamento contínuo dos projetos ou análise geral das conversas. |

Fontes locais: `src/components/initiatives/initiatives-workspace.tsx`, `src/lib/initiatives/storage.ts`, `src/app/(app)/gantt/page.tsx`, `src/lib/data/action-plan-gantt.ts`, `src/components/gantt/CLAUDE.md`, `src/app/(app)/assistente/CLAUDE.md`, `src/lib/agent/CLAUDE.md` e `src/app/api/integrations/slack/events/route.ts`.

A inspeção inicial foi feita por leitura do código e da documentação local. Depois da escolha da versão 2, o protótipo foi verificado no navegador local; o escopo e as evidências estão em `design-qa.md`. As integrações em produção não foram validadas.

## 3. Responsabilidade de cada área

| Área | Pergunta que resolve | Ação principal |
| --- | --- | --- |
| Projetos | Onde a execução precisa da minha intervenção? | Abrir um projeto, entender bloqueios e atuar nas tarefas. |
| Action Points | O que depende de mim? | Executar minhas tarefas e resolver solicitações dirigidas a mim. |
| Ativos de gestão | Qual procedimento ou critério rege este trabalho? | Consultar o ativo vigente e aplicá-lo à tarefa. |
| Agente | Como interpretar, resolver e acompanhar esta situação? | Explicar com fontes, executar ações autorizadas e iniciar acompanhamento de prazos. |
| Slack | Onde a equipe conversa sobre a execução? | Consultar o agente, responder ao acompanhamento proativo e confirmar previsões de entrega. |

Uma tarefa é o mesmo registro quando aparece no projeto e em Action Points. Concluir em uma área atualiza a outra e a ferramenta do cliente. Action Points não cria uma segunda lista com cópias independentes.

Proposta de nomenclatura: usar **Projetos** para o trabalho acompanhado e conectado. Manter **Iniciativas** separadamente apenas se houver uma distinção funcional real, como uma iniciativa estratégica que reúne vários projetos. Essa distinção ainda não está aprovada. O projeto de estruturação da metodologia pode orientar ações originadas no diagnóstico; projetos cotidianos do cliente não precisam obrigatoriamente nascer de um diagnóstico.

## 4. Projetos — primeira tela do gestor

A lista deve permitir uma leitura rápida da carteira, com filtros por responsável, situação, prazo e necessidade de intervenção. Cada linha reúne projeto, responsável, prazo, situação da execução, pendências relevantes e última atualização da fonte.

Separar situação registrada de avaliação do agente. Por exemplo: status do projeto "Em andamento"; sinal "Prazo em risco". O sinal precisa explicar por quê, citar as tarefas envolvidas e informar a atualidade dos dados. Não substituir silenciosamente o status do cliente por uma inferência.

No topo, mostrar um resumo curto de situações verificáveis: projetos com atrasos, bloqueios registrados e decisões pendentes para o gestor. Evitar começar por todos os indicadores possíveis ou por um resumo genérico produzido pela IA.

Não usar porcentagem de tarefas concluídas como medida automática do resultado do projeto. Dez tarefas pequenas concluídas não equivalem necessariamente a uma entrega crítica concluída.

### Ao abrir um projeto

O detalhe escolhido na versão 2 abre em **Precisam de atenção**, com objetivo, responsável e prazo compactos. Decisões e bloqueios precedem a tabela de acompanhamento; a aba **Todas as tarefas** reúne a lista completa. A seção 15 registra a implementação e seus limites. Os filtros e visualizações adicionais abaixo continuam como propostas.

| Elemento | Conteúdo e comportamento propostos |
| --- | --- |
| Resumo de atenção | Bloqueios, atrasos e decisões pendentes; cada item leva à tarefa ou à evidência. |
| Lista de tarefas | Título, responsável, status, prazo e bloqueio. Filtros: todas, precisam de atenção, minhas e sem responsável. |
| Visualizações | Lista como padrão; Kanban como alternativa. Calendário quando há agenda ou datas; cronograma quando existem dependências e duração confiáveis. |
| Ativos relacionados | Procedimentos vinculados ao projeto e às tarefas, com versão e seção relevantes. |
| Atividade | Alterações da ferramenta e conversas relacionadas, com origem e data. |
| Agente contextual | Ação "Consultar agente" abre um painel mantendo projeto, filtros e tarefa selecionada. |
| Acompanhamento proativo | Último contato com o executor, progresso informado, previsão confirmada, mudança de prazo e situações que exigem intervenção. |

Configurações do projeto ficam secundárias. O formulário atual de nome, objetivo, responsável e prazo não deve ser o destino principal de quem abriu um projeto para gerenciar sua execução.

### Ao abrir uma tarefa

Abrir um painel lateral, preservando a lista e o contexto do projeto. A pessoa vê descrição, responsável, prazo, status, dependências, comentários, evidências de entrega e critérios de conclusão. Procedimentos relacionados aparecem no próprio painel.

Oferecer ações diretas para o trabalho frequente: atualizar status, comentar, registrar bloqueio, anexar evidência e, conforme permissão, atribuir responsável ou ajustar prazo. A conversa com o agente é outra forma de realizar essas ações, não uma etapa obrigatória para clicar em "Concluir".

Exemplos de consultas do gestor: "O que impede esta entrega?", "Qual decisão depende de mim?", "Que critério falta para concluir?" e "Prepare uma atualização deste projeto".

## 5. Action Points — o que depende do gestor

A área passa a ser pessoal e transversal aos projetos, mantendo o rótulo atual como hipótese a validar. Um subtítulo como "Suas tarefas e decisões pendentes" explica a função.

Duas visões evitam misturar tipos de responsabilidade:

- **Minhas tarefas:** registros atribuídos à identidade vinculada da pessoa, em qualquer projeto autorizado.
- **Depende de mim:** aprovações, decisões e pedidos de desbloqueio explicitamente dirigidos à pessoa. A tarefa pode continuar atribuída a outro membro da equipe.

Cada item informa projeto, próxima ação, prazo e motivo pelo qual aparece ali. Estar atrasada ou pertencer à equipe do gestor, por si só, não transforma uma tarefa em responsabilidade pessoal dele. O acompanhamento da equipe permanece em Projetos.

Filtros úteis: pendentes, atrasados, próximos prazos e concluídos. Prioridades explícitas vêm da ferramenta; uma ordenação sugerida pelo agente deve informar seu motivo. Ausência de prazo aparece como "Sem prazo", sem criar horários fictícios.

Na vista "Depende de mim", uma aprovação só aparece como aprovação se existir um fluxo configurado. Quando o provedor não tiver esse recurso, representar a solicitação pelo mecanismo acordado com o cliente, como uma tarefa de aprovação ou campo específico. Não inventar um fluxo externo só porque o texto de um comentário contém "aprovar".

### Recomendações de diagnóstico

Preservar as recomendações atuais no diagnóstico/plano de estruturação. Elas não são automaticamente compromissos individuais de execução.

Fluxo proposto: recomendação → revisão pelo gestor → escolha de projeto, responsável, prazo e critério de conclusão → criação ou vínculo de tarefa na ferramenta do cliente → aparição em Projetos e, para o responsável, em Action Points.

Uma recomendação pode originar várias tarefas. Preservar o vínculo com o diagnóstico e evitar recriar as mesmas tarefas ao repetir a operação.

## 6. O agente dentro do trabalho

O agente global continua útil para perguntas entre projetos. O agente no projeto e na tarefa recebe contexto explícito, visível ao usuário. Exibir o escopo consultado: projeto selecionado ou todos os projetos autorizados.

| Capacidade | Exemplo | Resultado esperado |
| --- | --- | --- |
| Consultar | "O que está atrasado neste projeto?" | Lista com prazos, responsáveis e fontes. |
| Explicar | "Por que esta tarefa está bloqueada?" | Fatos registrados, possíveis causas identificadas como hipóteses e lacunas. |
| Preparar | "Prepare um pedido de atualização" | Rascunho editável, sem enviar a mensagem. |
| Executar | "Mude estas duas tarefas para Em revisão" | Proposta com tarefas e alterações; execução autorizada e confirmação da gravação externa. |
| Acompanhar proativamente, requerido para a evolução | O agente identifica uma tarefa próxima do prazo e pergunta ao executor como está a entrega. | Conversa iniciada pelo agente, previsão confirmada, prazo atualizado quando autorizado e comentário na tarefa; também pode acompanhar bloqueios por regra configurada. |

Alterações manuais simples não precisam passar por uma confirmação conversacional adicional. Para mudanças propostas pelo agente, sobretudo em lote, apresentar antes/depois e permitir revisar a seleção. Envio de mensagens e mudanças em compromissos de outras pessoas devem deixar claro destino e efeito antes da execução. Autonomia recorrente exige uma regra previamente configurada, não autorização implícita por existir uma conexão.

Após uma escrita, mostrar destino e resultado: "Status atualizado no ClickUp" somente quando confirmado pela fonte. Se houver falha, dados desatualizados, conflito com outra edição ou resposta inconclusiva, tornar isso visível. Não repetir uma criação sem verificar se ela já ocorreu. Uma mudança posterior na fonte deve refletir em todas as visões.

### 6.1. Acompanhamento proativo de prazos pelo Slack

**Requisito confirmado em 04/10/2026:** o agente deve assumir a rotina de acompanhamento das tarefas, iniciando conversas durante o dia. A frequência, a antecedência do contato e os limites de autonomia são parâmetros a definir; a capacidade proativa em si não é apenas uma hipótese.

Fluxo funcional requerido:

1. **Verificar tarefas:** em intervalos configuráveis ao longo do dia, consultar tarefas ativas, responsáveis e prazos na ferramenta de gestão do cliente.
2. **Identificar a necessidade de contato:** conforme o prazo se aproxima, iniciar uma conversa no Slack com o executor vinculado à tarefa. A mensagem identifica tarefa, projeto e prazo vigente, com acesso ao registro.
3. **Perguntar pelo andamento:** "Como está a tarefa Aprovar a página de oferta? A entrega está prevista para hoje às 16h." O executor informa progresso, pendências ou bloqueios em linguagem natural.
4. **Confirmar a previsão:** perguntar quando ele concluirá e se confirma o horário. Se a resposta for ambígua, esclarecer data, horário e fuso antes de alterar o prazo. A pessoa pode manter o compromisso ou pedir um ajuste.
5. **Registrar o resultado:** gravar um comentário na tarefa com quem informou, quando respondeu, andamento declarado, previsão confirmada e motivo do ajuste, quando houver. Se houver um novo horário confirmado e a regra de autonomia permitir, atualizar o prazo de conclusão na ferramenta de gestão.
6. **Refletir no app:** apresentar o registro confirmado no projeto e nos Action Points do executor. Destacar atrasos, mudanças e bloqueios relevantes ao gestor; criar uma pendência pessoal para ele somente quando uma decisão ou intervenção lhe for dirigida.
7. **Encerrar esse contato e continuar acompanhando:** fechar o ciclo da conversa após registrar o resultado. Reavaliar o novo compromisso nos próximos ciclos; uma previsão de entrega não equivale à conclusão da tarefa.

Exemplo fictício de conversa:

> Agente: "Como está a tarefa Revisar a página de oferta? O prazo é hoje às 16h."
>
> Executor: "Estou finalizando a revisão, mas falta ajustar a seção de preços."
>
> Agente: "Qual é sua previsão de conclusão?"
>
> Executor: "Hoje às 18h."
>
> Agente: "Você confirma a entrega hoje às 18h?"
>
> Executor: "Confirmo."
>
> Agente, após confirmação da gravação: "Atualizei o prazo para hoje às 18h e registrei sua atualização na tarefa."

Exemplo fictício de comentário na ferramenta: "Acompanhamento pelo agente via Slack: o executor informou que está finalizando a revisão e que falta ajustar a seção de preços. Confirmou a previsão de entrega para 04/10/2026 às 18h, no fuso America/Sao_Paulo. Prazo anterior: 04/10/2026 às 16h. Novo prazo registrado: 04/10/2026 às 18h."

O comentário distingue relato do executor de verificação do agente. "Executor informou que está finalizando" não significa que o agente comprovou o avanço. Preservar o prazo anterior no histórico para que uma reprogramação não apague o compromisso original nem esconda um atraso.

O agente registra o andamento informado e a previsão; não presume um novo status de execução nem marca a tarefa como concluída apenas porque a pessoa prometeu uma entrega. A conclusão depende de uma atualização explícita e dos critérios aplicáveis à tarefa.

### 6.2. Autonomia e exceções do acompanhamento

O fluxo normal deve ser resolvido entre agente e executor, dentro das regras configuradas pelo cliente. Não exigir aprovação do gestor para cada resposta ou ajuste permitido. A confirmação do executor é suficiente para ajustar o prazo quando ele tem essa autonomia e o conector permite a operação.

Se o ajuste ultrapassar a autonomia acordada, afetar um compromisso que exige aprovação ou não puder ser gravado, registrar a previsão solicitada e tornar a pendência visível ao responsável pela decisão. Não apresentar uma previsão solicitada como prazo já alterado. A configuração dessas regras permanece pendente de definição.

Outras situações precisam de comportamento explícito:

- **Sem resposta:** mostrar "Aguardando resposta"; não inferir andamento, confirmação ou novo prazo. Novos contatos e escalonamento seguem a cadência configurada.
- **Bloqueio informado:** registrar o relato e encaminhar o pedido de resolução à pessoa indicada pelo fluxo. O gestor recebe uma pendência quando sua intervenção é necessária.
- **Novo prazo vencido:** reabrir o acompanhamento conforme a regra e sinalizar o compromisso vencido; não reprogramar silenciosamente.
- **Tarefa concluída ou cancelada na fonte:** interromper os contatos de prazo pertinentes àquela tarefa.
- **Mudança externa durante a conversa:** conferir o estado atual antes da escrita; evitar sobrescrever uma atualização mais recente com a previsão discutida sobre o prazo antigo.
- **Falha parcial:** distinguir comentário gravado de prazo atualizado. Informar o que funcionou, manter a pendência e evitar comentários duplicados em tentativas de recuperação.

Parâmetros a definir com o cliente: horários de trabalho e fuso; frequência das verificações; antecedência para contato; intervalo entre novas mensagens; agrupamento de várias tarefas do mesmo executor; autonomia para alteração de prazo; situações que exigem decisão do gestor; momento de escalonamento por falta de resposta ou atraso.

Verificar tarefas periodicamente não significa enviar uma mensagem em toda verificação. Uma conversa aberta deve ser reutilizada enquanto o acompanhamento estiver pendente, sem iniciar cobranças paralelas para a mesma tarefa.

### 6.3. Como o acompanhamento aparece na interface

**Em Projetos**, a tarefa mostra prazo vigente, previsão confirmada e última atualização do executor. O painel reúne histórico de prazos, motivo do ajuste, comentário registrado e referência à conversa no Slack, respeitando o acesso da pessoa. O resumo de atenção destaca compromissos vencidos, bloqueios e solicitações que precisam do gestor.

**Em Action Points do executor**, a mesma tarefa mostra o novo prazo confirmado e o acompanhamento relacionado à sua entrega. **Em Action Points do gestor**, aparece uma ação somente quando ele precisa aprovar a reprogramação, resolver um bloqueio ou atender a outra solicitação dirigida a ele. Uma simples atualização de andamento permanece disponível em Projetos e no histórico da tarefa, sem virar automaticamente uma tarefa do gestor.

Estados sugeridos para o acompanhamento: "Aguardando resposta", "Previsão confirmada", "Ajuste solicitado", "Prazo atualizado" e "Intervenção necessária". Esses rótulos descrevem o acompanhamento, separados do status operacional da tarefa. O texto específico da interface ainda será validado.

## 7. Exemplo de uso completo pelo gestor

Exemplo fictício: projeto "Novo website", tarefa "Aprovar a página de oferta".

1. O gestor abre Projetos e vê que a aprovação da oferta precisa de sua atenção. O item mostra prazo e origem.
2. Abre o projeto e encontra a tarefa na lista, com a solicitação de aprovação e seu responsável de execução.
3. Abre o painel da tarefa. Consulta a entrega, os critérios do SOP de publicação e uma conversa vinculada no Slack, se tiver acesso.
4. Pergunta ao agente se os critérios estão atendidos. O agente separa evidências disponíveis e pontos que não conseguiu verificar.
5. O gestor aprova ou solicita ajustes. A ação é registrada pelo fluxo escolhido na ferramenta do cliente; qualquer comentário a publicar pode ser revisado.
6. Projetos e Action Points refletem o resultado confirmado. O solicitante recebe o aviso previsto no fluxo, caso isso tenha sido configurado.

Esse percurso precisa funcionar também por controles diretos. A contribuição do agente é reduzir a recuperação de contexto e preparar a decisão, sem remover a capacidade de operar a tela.

## 8. Configuração das conexões

A configuração é feita pelo administrador autorizado da empresa; no uso cotidiano, o gestor encontra projetos já conectados. A disponibilidade depende da ferramenta escolhida e das permissões concedidas.

Passos funcionais: conectar a ferramenta → selecionar os espaços de trabalho permitidos → definir o que representa um projeto → mapear status, responsáveis, prazos e critérios → vincular pessoas → associar canais/conversas do Slack e ativos relevantes → conferir uma prévia do que será exibido e do que poderá ser alterado.

Um projeto da DirectScal pode corresponder a uma lista, board ou conjunto configurado de registros; não assumir que as três ferramentas usam a mesma estrutura. Para Notion, por exemplo, o cliente precisa indicar a estrutura e as propriedades que representam tarefas.

Ativos relacionados podem ser indicados pelo gestor ou sugeridos pelo agente. Uma sugestão de SOP não estabelece uma obrigação operacional até que o vínculo seja validado. No caso de procedimento associado, explicitar versão e critérios aplicáveis.

O canal do Slack é uma associação de contexto, não uma autorização para ler todo o workspace. Começar pelas conversas e canais selecionados. Acesso do conector não equivale a permissão de cada pessoa para ver o conteúdo na DirectScal.

## 9. Identidade e permissões

O mesmo e-mail é um bom ponto de partida para sugerir que as contas pertencem à mesma pessoa. A experiência desejada é que o administrador ou usuário confira as contas encontradas uma vez, sem preencher IDs técnicos.

Após vinculação validada, o sistema utiliza os identificadores das contas e dos espaços de trabalho. Precisa tratar e-mails diferentes, convidados, conta não encontrada, mudança de e-mail e usuário removido. Não ampliar acesso nem atribuir responsabilidades apenas por coincidência de nome ou e-mail.

No Slack atual, a auditoria identifica a pessoa por workspace e usuário externo; isso não prova vínculo com a conta DirectScal. A consulta de e-mail exige um escopo específico. No Notion, a presença do e-mail depende das capacidades da conexão. Portanto, "usar o mesmo e-mail" não dispensa um fluxo de vinculação e verificação.

Minhas tarefas inclui somente atribuições confirmadas à identidade vinculada. Aprovações incluem somente solicitações dirigidas a essa pessoa. Leituras e ações preservam o escopo de empresa e o acesso autorizado à fonte; um bot com acesso amplo não deve ampliar a visão de um usuário.

## 10. Camada de inteligência — procedimento, execução e comunicação

Cada fonte responde a uma pergunta distinta:

- SOPs e ativos descrevem como o trabalho deve ocorrer e quais critérios se aplicam.
- A ferramenta de gestão registra atribuição, prazo, status e evidências da execução.
- O Slack fornece contexto de comunicação nas conversas acessíveis e vinculadas.

O cruzamento depende de vínculos entre projeto, tarefa, procedimento e conversa. Compartilhar um tema ou citar uma palavra parecida não comprova que uma mensagem pertence à tarefa.

Começar com situações úteis ao gestor: bloqueio registrado que continua sem resolução; aprovação pendente que impede entrega; tarefa marcada como concluída sem evidência exigida pelo procedimento vinculado; divergência entre um status e uma comunicação explicitamente relacionada.

Formato de uma análise: **fato observado → regra ou critério aplicável → interpretação → ação sugerida**. Incluir links para fontes, datas, período analisado, cobertura disponível e informação ausente. O usuário pode corrigir o vínculo ou a interpretação e dispensar uma sugestão.

Exemplo fictício: o SOP vinculado exige checklist e aprovação antes da publicação; uma tarefa está concluída; o checklist não aparece entre os dados acessíveis. O sistema sinaliza "Evidência de conclusão não localizada" e sugere pedir a evidência. Não declara que o trabalho não foi feito, pois ele pode ter ocorrido fora das fontes disponíveis.

"Engajamento" ainda precisa de uma definição operacional. Volume de mensagens, presença online e uso do bot não medem entrega, colaboração ou comprometimento. Preferir indicadores de fluxo: tempo para resolver bloqueios, tempo de espera por aprovação e regularidade das atualizações previstas pelo processo. Não transformar pouca atividade observada em avaliação automática da pessoa.

Dados históricos incompletos ou falha de sincronização devem reduzir a cobertura declarada. A resposta pode ser "Não há dados suficientes para avaliar". A integração atual de consulta no Slack e essa análise contínua são capacidades distintas.

## 11. Controle dos dados e promessa comercial

Princípio solicitado pelo usuário: os registros de projeto ficam na ferramenta contratada e controlada pelo cliente. A DirectScal é a interface de operação e inteligência; uma desconexão não deve apagar os projetos da fonte.

Formulação proposta para validar: **"Seus projetos continuam na ferramenta e na conta da sua empresa. A DirectScal conecta a execução aos seus procedimentos e facilita a gestão, sem exigir que você migre os projetos para uma base proprietária."**

Evitar a promessa "nenhum dado fica com a DirectScal" antes de definir processamento, retenção, índices, cache, auditoria, anexos e uso de provedores de IA. Os ativos de gestão e a auditoria do agente já têm persistência no sistema atual. Fonte de verdade sob controle do cliente e ausência absoluta de processamento ou armazenamento são afirmações diferentes.

Decisões pendentes: quais dados derivados são retidos, por quanto tempo, quem pode acessá-los, como são removidos após desconexão e qual capacidade permanece se a ferramenta externa estiver indisponível.

## 12. Ordem recomendada e critérios de aceite

| Etapa proposta | Entrega funcional | Critério de aceite |
| --- | --- | --- |
| 1. Validar a experiência | Protótipo no shell Symbach de Projetos, tarefa em painel, Action Points pessoal e agente contextual, incluindo um acompanhamento proativo completo com exemplos fictícios. | Um gestor localiza uma pendência e identifica a decisão necessária; um executor responde ao acompanhamento e entende onde o novo compromisso foi registrado. |
| 2. Conectar uma ferramenta | Um conector escolhido a partir do cliente piloto, com leitura e operações cotidianas definidas; identidade e permissões verificadas. | Uma tarefa atribuída aparece na visão pessoal certa; uma edição confirmada aparece na fonte e em todas as visões, sem duplicação. |
| 3. Executar e acompanhar com o agente | Consulta contextual, ações autorizadas e ciclo proativo: verificar prazo, conversar no Slack, confirmar previsão, comentar e ajustar o prazo permitido. | O executor confirma uma previsão, a fonte registra comentário e prazo, ambas as áreas refletem o resultado e apenas exceções geram intervenção do gestor. Sem resposta não altera o compromisso; tentativas repetidas não duplicam contatos ou comentários. |
| 4. Cruzar fontes | Relações validadas com procedimentos e conversas; poucas análises úteis e rastreáveis. | Cada sinal mostra evidência e cobertura; ausência de evidência não é tratada como ausência de trabalho. |
| 5. Ampliar o acompanhamento | Regras adicionais para bloqueios, dependências, aprovações e avisos. | Uma situação relevante gera a ação ou aviso previsto; estado sem mudança não produz contatos fora da cadência definida. |

Não é necessário concluir os três conectores para validar a experiência. Não tratar o primeiro conector como promessa de equivalência total entre ClickUp, Notion e Monday. A lista de operações suportadas deve ser definida por ferramenta, com comportamento visível para recursos indisponíveis.

Antes de implementar as integrações, escolher o cliente/ferramenta piloto, o recorte de projetos, as operações essenciais, o mecanismo de aprovação e os parâmetros de acompanhamento da seção 6.2. Validar também se o rótulo Action Points comunica a função pessoal; o termo "Minhas ações" pode ser testado, sem alteração de nomenclatura neste estudo.

## 13. Roteiro para validação de usabilidade

Usar os mesmos exemplos e dados fictícios para comparar execução por controles diretos e execução assistida pelo agente. Observar o percurso completo, não apenas a compreensão da primeira tela.

1. Identificar qual projeto exige intervenção e explicar o motivo.
2. Resolver uma aprovação, com acesso ao procedimento e à evidência da entrega.
3. Registrar um bloqueio e atribuir o pedido de resolução à pessoa correta.
4. Encontrar uma tarefa pessoal que pertence a outro projeto.
5. Identificar uma falha de sincronização e distinguir proposta de alteração e gravação confirmada.
6. Receber uma análise com informação incompleta e reconhecer o que está comprovado e o que é hipótese.
7. Como executor, responder ao contato proativo, confirmar uma nova previsão e localizar o comentário e o prazo atualizado na tarefa.
8. Como gestor, distinguir uma atualização comum de uma solicitação que exige sua intervenção.
9. Reconhecer um acompanhamento sem resposta ou uma gravação parcial, sem interpretar a tarefa como concluída ou o prazo como alterado.

Registrar conclusão sem ajuda, tempo para resolver, saídas para a ferramenta externa, erros de atribuição, confiança na origem dos dados e intervenções exigidas do moderador. Não definir uma meta numérica de eficiência antes de medir o percurso atual. A hipótese é reduzir o tempo e as trocas de contexto do gestor; precisa ser testada.

## 14. Referências externas consultadas

Documentação oficial consultada em 04/10/2026. Fundamenta limites de integração; não comprova implementação no repositório.

- [Slack — users.lookupByEmail](https://docs.slack.dev/reference/methods/users.lookupByEmail/): localização de usuário por e-mail e escopo `users:read.email`.
- [Slack — conversations.history](https://docs.slack.dev/reference/methods/conversations.history/): acesso ao histórico condicionado a token, escopo e participação na conversa.
- [Notion — User](https://developers.notion.com/reference/user): e-mail de pessoa disponível conforme as capacidades da conexão.
- [ClickUp — Tasks](https://developer.clickup.com/docs/tasks): tarefas, atribuição por IDs, prazos e dependências.
- [Monday — Boards](https://developer.monday.com/api-reference/reference/boards): boards, itens e níveis de acesso.

## 15. Decisão de interface e implementação local

Em 04/10/2026, o usuário escolheu a **versão 2** entre as três alternativas apresentadas para o detalhe de projeto. A prioridade é o gestor: situações que exigem sua intervenção aparecem antes do acompanhamento cotidiano.

A interface foi implementada na rota existente `/iniciativas/[id]`, mantendo o shell e o agrupamento Iniciativas da branch `symbach`. A visão padrão é **Precisam de atenção**, com duas tabelas conforme o Figma atualizado: **Situações que precisam de você** reúne aprovações e bloqueios com tarefa, executor, prazo e acompanhamento; **Em produção** reúne as demais tarefas não concluídas e não suspensas, com estados como prazo confirmado, aguardando resposta e sem contato. Clicar na tarefa abre Progresso, com contexto e acesso a Tomada de decisão. Suspensas permanecem em Todas as tarefas.

As outras abas são **Todas as tarefas**, com busca por tarefa, executor e status; **Atividade**, com autor, origem e horário; e **Ativos relacionados**, inicialmente sem vínculos. Cada tarefa abre em painel lateral para status, prazo, critérios, decisão e comentários. A aprovação conclui a tarefa após conferência dos critérios; resolver bloqueio mantém a execução em andamento. O prazo original e o histórico de mudanças ficam preservados. A alteração manual de prazo retira a confirmação do compromisso anterior.

**Escopo implementado:** demonstração frontend. O projeto Novo website contém cinco tarefas fictícias para testar a experiência; outros projetos começam vazios. Criação de tarefas, decisões, comentários e ajustes existem em estado de tela e reiniciam ao recarregar ou trocar de projeto. Metadados da iniciativa mantêm o armazenamento local anterior. Consultar agente abre uma prévia contextual com respostas derivadas das tarefas visíveis, sem chamar um modelo. Ativos relacionados permite acessar a biblioteca existente, sem representar vínculos ainda não implementados.

**Ainda planejado:** tarefas reais da ferramenta do cliente, identificação de executores, autorização, persistência compartilhada, ações via agente, conversa e acompanhamento proativo no Slack, sincronização e cruzamento de fontes. A tela não envia mensagens nem modifica tarefas externas. Action Points permanece sem alteração nesta entrega. O ciclo proativo descrito na seção 6 continua sendo requisito confirmado, com execução futura.

A comparação com a imagem escolhida e a validação local estão em `design-qa.md`. O registro externo acompanha a página [Symbach — Shell e iniciativas](https://app.notion.com/p/3ee026c1ddec81cea86fc7cc73cda7e5).

O usuário atualizou a referência visual no Figma, frame `252:2`, em 04/10/2026. As tabelas e botões seletores do projeto adotam os componentes compartilhados descritos em `padroes-de-tabelas-e-seletores.md`: cabeçalho neutro arredondado sem contorno externo e abas com opção ativa preenchida, sem sublinhado. Este passa a ser o padrão para todas as próximas tabelas e botões seletores, preservando os fluxos e os limites funcionais desta seção.

## 16. Próxima validação com o gestor

Testar se a ordem da versão 2 ajuda a localizar e resolver uma pendência sem consultar a ferramenta de gestão. Observar também se a pessoa distingue confirmação de prazo, ausência de resposta e bloqueio. O painel de tarefa deve permitir explicar o que aconteceu, quem confirmou e onde o compromisso será registrado quando a integração existir.

Antes da integração, validar acesso à evidência da entrega, critérios de aprovação, responsabilidade por resolver cada bloqueio e parâmetros de contato do agente. A equivalência de identidade por e-mail e a propriedade dos registros seguem sujeitas aos contratos e limites documentados acima.

## 17. Progresso da tarefa e tomada de decisão

**Requisito confirmado em 04/10/2026:** a camada agente é uma camada de gerenciamento e apoio à tomada de decisão. Deve reunir o que aconteceu na tarefa e pedir intervenção do líder quando a execução depende de uma decisão. Consulta passiva e acompanhamento proativo alimentam a mesma história da tarefa.

### Experiência implementada na interface

O painel abre em **Progresso**. A linha do tempo segue a referência de logs enviada pelo usuário: conector fino, ícone circular com contorno, autor e ação, contexto, categoria, origem e horário. Acompanhamento, resposta do executor, impedimento e decisão ficam identificados. Contexto em vermelho e o botão **Decidir com o agente** aparecem enquanto houver intervenção pendente; a aba **Tomada de decisão** também fica vermelha, com ícone e texto. **Detalhes** concentra edição de status/prazo e resultado esperado. Seletores e tabelas preservam os componentes aprovados.

Na área de decisão, o líder lê o contexto, escolhe o próximo passo e escreve sua instrução. **Preparar decisão** mostra o efeito sobre a tarefa, o comentário para o card e a mensagem para o executor. Nada é alterado nessa preparação. O líder pode editar ou confirmar a proposta; somente confirmar gera os registros na tarefa e na Atividade do projeto.

| Ação | Efeito desta demonstração | Pendência e comunicação |
| --- | --- | --- |
| Adiar prazo | Exige prazo posterior ao atual, preserva o original e retira a confirmação anterior. | Bloqueio ou aprovação permanece pendente. Comentário e mensagem são prévias, sem presumir aceite do executor. |
| Suspender tarefa | Muda para Suspensa, conservando prazo, histórico e impedimento. Sai das tabelas de atenção/produção e permanece em Todas as tarefas. | Pode ser retomada em Detalhes; a pendência anterior volta ao acompanhamento. |
| Solicitar uma call | Registra a solicitação de alinhamento e a orientação escrita. | Mantém prazo, status e impedimento. Não cria reunião nem link de call. |
| Orientar executor | Registra orientação e prepara a comunicação. | Mantém status, prazo e pendência até existir uma resolução. |

Aprovar entrega continua exigindo conferência dos critérios e conclui a tarefa. Registrar resolução do bloqueio exige uma descrição, retira o bloqueio e mantém Em andamento. Ambas são ações locais em Tomada de decisão. Uma instrução livre, adiamento ou call não substitui essa resolução. Alterações não salvas em Detalhes bloqueiam a preparação até serem salvas.

### Agente e comunicação quando as integrações existirem

Fluxo esperado: detectar a exceção → apresentar contexto e evidências → colher a decisão do líder → revisar o efeito → aplicar a ação autorizada na ferramenta do cliente → comentar no card com autor, motivo e novo compromisso → comunicar ao executor no Slack → refletir o resultado em Projetos e Action Points. A mesma tarefa canônica sustenta ambas as visões; nesta entrega Action Points não foi alterado.

A solicitação ao líder precisa distinguir fato observado, resposta do executor e interpretação do agente. Deve permitir abrir a evidência e informar quem pode decidir. As instruções poderão ser interpretadas em linguagem natural; prazo, destinatário e ação ambíguos precisam ser esclarecidos antes de executar. O executor deve poder responder e confirmar o novo compromisso. Suspensão, atraso e call não significam entrega concluída.

Cada etapa externa precisa de estado próprio: preparada, pendente, concluída ou falhou. Registrar decisão não prova comentário gravado ou mensagem entregue. Falha de Slack não deve desfazer silenciosamente um prazo já aplicado; mostrar resultado parcial e permitir retomar somente a etapa pendente, evitando duplicatas. Revalidar tarefa, permissões e prazo na fonte antes de executar. Um pedido de call requer combinação explícita; agenda e participantes dependerão da integração correspondente.

### Limites e critérios de aceite

A implementação atual é frontend e determinística. A resposta usa a ação escolhida e a orientação escrita; não há modelo, leitura de Slack, motor periódico, calendário, ferramenta conectada ou envio externo. A confirmação registra três eventos: decisão do líder, comentário preparado e mensagem preparada. Os dois últimos exibem **Prévia · Não enviado**, inclusive na Atividade. Tarefas e logs ficam em estado React e reiniciam na recarga.

Validar: abrir a tarefa e entender a sequência de progresso; localizar decisão e contexto; revisar sem alterar dados; confirmar e encontrar autor/horário e prévias no histórico; adiar sem perder o compromisso original nem resolver bloqueio; suspender sem concluir e retomar com a pendência preservada; solicitar call sem criar reunião ou concluir tarefa; manter aprovação e resolução explícitas. Verificar claro/escuro, foco, teclado e largura do painel. Sincronização externa e visão pessoal dependem das etapas de integração previstas.
