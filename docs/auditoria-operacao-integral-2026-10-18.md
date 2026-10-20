# Auditoria para operação integral do cliente

Data: 18/10/2026, horário de São Paulo. Base: código local mais recente da branch `main`, sobre o commit `dc1fa55`, incluindo alterações ainda não commitadas. Esta auditoria não muda funcionalidades nem declara homologação de produção.

Registro no Notion: [Auditoria de operação integral — cliente e DirectScal](https://app.notion.com/p/3fd026c1ddec819090ace2e08b0012f5). Cópia privada com o mesmo inventário, vinculada ao item F10 de homologação existente.

## Objetivo e escopo confirmado

O cliente precisa sair da medição de maturidade e chegar à aplicação dos ativos de gestão, com acompanhamento real de responsáveis, interação proativa dos agentes no Slack e leitura confiável do resultado. A operação DirectScal precisa conseguir produzir, publicar, sustentar e corrigir cada elo dessa entrega.

O usuário confirmou: testar o código local; usar a empresa de teste com instalação Slack ativa; considerar três camadas de aderência; incluir abordagem proativa, conversa sobre dificuldades, evidências, atualização, cobrança e escalonamento pelo agente. Não foi solicitado implementar as correções nesta etapa.

**Conclusão: o sistema ainda não atende à operação integral confirmada.** Coleta, entrega editorial básica, ativos textuais e consulta possuem caminhos reais testados. Aderência e impacto ainda usam demonstrações, o acompanhamento proativo não existe e há divergências concretas entre publicação, Action Points e PDFs. Não há base para atribuir um percentual geral de conclusão ao produto.

As três camadas são distintas:

| Camada | O que precisamos verificar | O que não comprova a camada seguinte |
| --- | --- | --- |
| Conhecimento e uso | Pessoas acessam, entendem e consultam a versão vigente | Uma pergunta ao agente não comprova execução da rotina |
| Execução e aderência | Ciclos previstos, cumpridos, evidências, exceções, responsáveis e atrasos | Relato de conclusão não comprova melhoria da operação |
| Resultado | Evolução das mesmas perguntas/indicadores, linha de base, confiança e revisão | Estimativa do agente não substitui a coleta nem demonstra causalidade |

O roteiro anterior de 07/10 era mais estreito: deixava acompanhamento proativo para evolução posterior. O escopo aprovado nesta conversa passa a incluir essa capacidade no fechamento. As tarefas antigas não podem ser consideradas suficientes sem essa revisão de escopo.

## Como ler o inventário

O inventário abaixo descreve a experiência completa desejada, incluindo capacidades ausentes. Não é uma lista apenas de telas. Cada requisito precisa ter contraparte operacional, dados persistidos, permissões e tratamento de falhas.

Estados: **testado** = caminho específico executado e resultado conferido; **parcial** = parte existe, mas há lacuna comprovada; **demonstrativo** = interface usa dados fictícios; **ausente** = nenhum caminho funcional correspondente encontrado; **não homologado** = existe implementação, mas o ciclo não foi executado nesta rodada. Um teste pontual não homologa todos os estados da funcionalidade.

## Inventário completo — cliente

| ID | Funcionalidade necessária | Experiência esperada quando completa | Situação observada |
| --- | --- | --- | --- |
| C01 | Entrada e reentrada | Entrar, sair, retomar a empresa correta e preservar dados em outro navegador | Sessão real existente usada; reentrada OAuth nova não homologada |
| C02 | Aquisição/cadastro | Cadastro por campanha cria conta, empresa e acesso sem duplicidade | Implementação existente; nova aquisição não homologada |
| C03 | Recuperação de acesso | Google/senha orientados conforme o método real de acesso | Parcial: endpoint de recuperação retorna sucesso sem enviar instruções |
| C04 | Perfil | Nome, foto e posição persistem entre sessões | Testes de identidade light/dark passaram; senha é simulada |
| C05 | Dados da empresa | Consultar e editar os campos permitidos da própria empresa | Leitura observada; escrita não homologada |
| C06 | Preparação inicial | Saber requisitos pendentes e concluir implantação com Slack/setores válidos | Parcial: instalação ativa pode dispensar a tela sem comprovar todos os requisitos |
| C07 | Conexão Slack | Instalar, conferir workspace, reconectar e desconectar com clareza | Instalação existente e diretório testados; nova instalação/revogação não homologadas |
| C08 | Setores e lideranças | Vincular pessoas ativas do Slack ao setor, com cargo opcional | Leitura real confirmada; troca/inativação e administração completa não homologadas |
| C09 | Acessos ao painel | Diferenciar dono e administrador; manter convites Google legados compatíveis | Contratos e controles existentes; aceite novo e revogação não homologados |
| C10 | Lista de pesquisas | Ver status, base, criador, filtros e ações corretas | Interface observada com pesquisas reais e pesquisa fictícia da auditoria |
| C11 | Criar e configurar pesquisa | Nome, prazo e lideranças definem escopo persistido | Criação e ativação pela interface testadas |
| C12 | Ativar e distribuir | Links distintos para fundador/liderança e time por setor | Três links gerados na ativação da pesquisa de teste |
| C13 | Resposta pública | Responder anonimamente, inclusive em mobile, com validação completa | API recebeu três conjuntos completos; formulário em 375px light/dark preenchido com 30 respostas, envio e página Obrigado confirmados |
| C14 | Duplicidade, prazo e encerramento | Bloquear reenvio no mesmo navegador e novas respostas fora da coleta | Reenvio bloqueado e encerramento testados; trava é por navegador, não identidade |
| C15 | Acompanhar e encerrar pesquisa | Contadores conciliam; encerramento preserva base e inicia análise | Encerramento e leitura dos registros testados |
| C16 | Analytics | Notas, camadas e bases reproduzem os dados coletados | Base controlada média 3,0; métricas de impacto continuam ilustrativas |
| C17 | Dimensões e perguntas | Investigar vulnerabilidade, dispersão, gap e comparação por coleta | Implementado; inspeção de cálculo e testes unitários, sem homologação visual de todas as dimensões |
| C18 | Comparar períodos | Escolher coleta e distinguir variação histórica de estimativa | Implementado; ponderação e bases exigem validação metodológica explícita |
| C19 | Relatório publicado | Receber somente análise revisada para a própria empresa | Publicação fictícia e leitura autenticada testadas |
| C20 | Exportar relatório | PDF contém o mesmo conteúdo editorial aprovado da leitura | Falha comprovada: PDF não contém o texto editorial da entrega |
| C21 | Prioridades aprovadas | Receber a seleção exata de Action Points do especialista, ligada à coleta | Falha: página principal demonstrativa; conversor real descarta dimensão por comparação de nomes |
| C22 | Exportar Action Points | Plano exportado concilia com seleção, contexto e publicação | Parcial: PDF automático pode sair antes da publicação e não consome a seleção editorial |
| C23 | Encontrar ativos | Buscar e navegar por categoria, tipo e apresentação Quadro/Tabela | Biblioteca real existente e leitura publicada testada por tipos textuais |
| C24 | Ler ativo vigente | Conteúdo, sumário, versão e metadados correspondem ao publicado | SOP, Playbook e Governança sujeitos ao ciclo editorial de teste; RACI tem limitação operacional |
| C25 | Organizar pastas | Criar, renomear, ordenar, trocar ícone e excluir redistribuindo documentos | Implementado com testes unitários; ciclo completo de mutações ainda não homologado nesta rodada |
| C26 | Editar ativo como dono | Salvar nova versão, detectar concorrência e atualizar busca sem perder texto | Atualização fictícia criou versão 2; conflito com versão antiga teve timeout em duas verificações de 65 segundos, sem 409 confirmado |
| C27 | Exportar ativos | Obter o documento correto sem expor outra empresa | Markdown autenticado implementado; download por todos os tipos não homologado |
| C28 | Fonte entre problema, ação e ativo | Abrir a origem da recomendação e o ativo que sustenta a rotina | Ausente como vínculo persistido completo |
| C29 | Responsável real | Escolher pessoa ativa do Slack e transferir responsabilidade com histórico | Backend parcial; página principal não usa o fluxo real e tabelas estão ausentes no banco |
| C30 | Etapas e prazos | Atribuído, em implementação, bloqueado, concluído; datas e progresso duráveis | Parcial: contratos/API existentes, execução indisponível no ambiente conectado |
| C31 | Recorrência e ocorrências | Separar ação pontual, rotina periódica e rotina por evento, com ciclos esperados | Demonstrativo; cadastro de cadência não é motor de recorrência |
| C32 | Evidências de execução | Registrar relato, documento/link, data, ciclo, autor e validação | Demonstração de relatos; sem modelo completo de evidência/ciclo |
| C33 | Conversa proativa | Agente inicia contato no Slack no momento devido, com contexto da ação | Ausente |
| C34 | Conversa contextual | Responsável responde; agente pergunta sobre dificuldade e evidência e entende continuidade | Consulta a documentos existe; conversa de execução ainda não existe |
| C35 | Atualização por conversa | Agente propõe/grava andamento no item certo e confirma o que mudou | Ausente |
| C36 | Atrasos e bloqueios | Lembrete, negociação, silêncio, retomada e escalonamento sem mensagens excessivas | Ausente |
| C37 | Aprovação e intervenção humana | Gestor valida evidência, devolve, orienta ou ajusta prazo com histórico | Demonstrações de projetos; sem ciclo operacional persistido |
| C38 | Aderência por pessoa, ativo e setor | Medir ciclos cumpridos sobre previstos, com período, base e exceções | Demonstrativo na página `/action-points` |
| C39 | Uso e utilidade da consulta | Ver pessoas que consultam, cobertura e avaliações com bases corretas | Dados reais de auditoria; identidade e denominador não conciliam lideranças Slack |
| C40 | Resultado e estimativa | Ver ganho observado e estimado com origem, confiança e revisão | Demonstrativo para avanço por ações, vínculos e estimativas |
| C41 | Agente de consulta no app | Perguntar, continuar conversa, abrir fontes e avaliar resposta | API real testada com fonte e feedback; interface conectada; acesso não está na sidebar |
| C42 | Agente no Slack | Consultar por menção/DM/thread, com fonte, recusa e avaliação | Callback local assinado sintético aceito em 464ms; resposta com fonte auditada e entregue no DM real de teste. Entrada externa, menções/threads/feedback Slack não homologados nesta rodada |
| C43 | Histórico de conversas | Retomar uma consulta no app e encontrar registros relevantes de acompanhamento | Auditoria existe; chat do app conserva mensagens apenas no estado da tela |
| C44 | Alertas e pendências | Abrir alertas reais de atraso, falha, revisão e decisão | Botão visual existente; central operacional sem implementação encontrada |
| C45 | Suporte e especialista | Saber quem acompanha a empresa e abrir contato correto | Parcial: cartão do relatório tem especialista e contato fixos |
| C46 | Iniciativas/projetos oferecidos | Compartilhar tarefas, decisões e integração com ferramenta do cliente | Metadados em localStorage; tarefas e comunicações demonstrativas. Não operar como funcionalidade concluída |
| C47 | Isolamento e continuidade | Acessar somente a empresa autorizada, preservar versões e não perder alterações | Leitura de ativo de outra empresa negada com 404; fronteiras cliente/admin exercitadas; matriz completa de permissões ainda pendente |
| C48 | Uso acessível e falhas claras | Light/dark, teclado, mobile público, vazio, carregamento e recuperação | Agente desktop light/dark e formulário 375px light/dark observados; formulário sem overflow horizontal. Não equivale a auditoria global de acessibilidade |

## Inventário completo — operação DirectScal

| ID | Funcionalidade necessária | Contrapartida que sustenta o cliente | Situação observada |
| --- | --- | --- | --- |
| D01 | Acesso interno | Entrada administrativa separada do cliente | Implementado; fronteiras verificadas nos testes existentes com ressalva de timeout inicial |
| D02 | Equipe e papéis internos | Definir quem opera, revisa e publica e rastrear ações | Cadastro de especialistas persiste; especialista não equivale a usuário com permissão operacional própria |
| D03 | Campanhas e formulários | Criar links, campos, status e origem da aquisição | Implementado; nova campanha/cadastro não homologados |
| D04 | Leads | Consultar lead, origem, qualificação e conversão | Implementado; leitura/escrita comercial não homologada integralmente |
| D05 | Empresas | Manter cadastro operacional independente de exemplos e sem duplicidade | Lista deriva de organizações/leads; detalhe ainda usa preview de operação |
| D06 | Contratação e habilitação | Liberar módulos por empresa e refletir a oferta combinada | API de acesso existe; coerência entre páginas/APIs precisa ser homologada |
| D07 | Especialista principal da empresa | Atribuição durável orienta novas entregas e contato do cliente | Demonstrativo no detalhe da empresa: alteração apenas no estado React |
| D08 | Implantação acompanhada | Ver Slack, setores, responsáveis e pendências de preparação por cliente | Não há cockpit operacional completo encontrado |
| D09 | Gestão de membros | Dar/remover acesso com papel correto sem confundir líder Slack e usuário do app | Compatibilidade Google e membership existem; manutenção completa não homologada |
| D10 | Suporte à coleta | Identificar coleta sem público/base, links, erros e prazo | Fluxo de cliente implementado; suporte operacional agregado parcial |
| D11 | Integridade e anonimato | Respostas completas, agregação correta e proteção de bases pequenas | Validação de conjunto existe; gravação sessão/respostas não é transacional; mínimo atual permite uma pessoa |
| D12 | Fila de entregas | Receber diagnóstico encerrado consolidável, status e responsável | Implementado e alimentado por relatórios reais |
| D13 | Análise técnica | Conferir seis dimensões, camadas, gaps e perguntas antes de interpretar | Implementado; revisar textos fixos e o que é método versus achado da empresa |
| D14 | Redação editorial | Salvar resumo, leitura, vulnerabilidades, causas, recomendações e conclusão | Gravação e publicação fictícias testadas |
| D15 | Revisão e aprovação de relatório | Rascunho e revisão ficam separados da versão visível | Falha: salvar após publicação altera imediatamente o conteúdo público |
| D16 | Publicação de entrega | Publicar relatório, seleção de ações e autoria de forma coerente | Implementado; integridade entre consumidores está quebrada |
| D17 | Revisões de entrega | Preservar histórico, autor, aprovação, versão vigente e rollback | Ausente como ciclo de versões editoriais de relatório |
| D18 | PDF e exportações | Publicar o mesmo material revisado em todas as superfícies | Falha editorial comprovada no PDF; Action Points PDF usa outra fonte |
| D19 | Catálogo de Action Points | Criar/adaptar recomendação à empresa, com origem e indicador | Catálogo estático e seleção existem; autoria e parametrização operacional incompletas |
| D20 | Publicar Action Points | A seleção chega ao cliente e ao agente sem perder origem | Falha de integração por nome de dimensão e página substituída por demonstração |
| D21 | Vincular ações a perguntas e ativos | Mapear o problema tratado, rotina necessária e documento vigente | Ausente como relação operacional persistida completa |
| D22 | Responsáveis e acordos | Definir pessoa, começo, prazo, cadência e transferência | Backend parcial e migração local não aplicada no banco conectado |
| D23 | Modelar ciclos de aderência | Persistir recorrência, feriados/fuso aplicável, oportunidades e exceções | Ausente; documentar regra mínima necessária, sem inventar percentual |
| D24 | Produção de ativos | Criar SOPs, Playbooks, Governança e RACI da empresa correta | Tipos textuais têm editor; RACI não pode ser criado pelo contrato do admin |
| D25 | Revisão e publicação de ativos | Rascunho, revisão, aprovação, publicação, versões e arquivo | Ciclo real de teste nos tipos textuais |
| D26 | Atualização da base do agente | Publicação troca versão consultável; rascunho/arquivado não entram | Indexação real e fonte correta testadas no SOP fictício |
| D27 | Validade do acervo | Responsável, periodicidade, revisão vencida e tratamento de mudanças | Metadados existem; fila automática de revisões e aviso não encontrados |
| D28 | Pastas e organização do acervo | Operação e cliente compartilham categorias estáveis e metadados | Registro compartilhado existe; homologar propagação completa de renomear/excluir |
| D29 | Configurar agente por cliente | Objetivo, público, contexto, horários, cadência, canais e limites | Provedor por ambiente; configuração de acompanhamento por cliente ausente |
| D30 | Iniciar acompanhamento | Agendar check-ins e abrir conversa no Slack com contexto correto | Ausente |
| D31 | Receber e interpretar execução | Classificar relato, bloqueio e evidência sem misturar consulta documental | Ausente; eventos atuais encaminham perguntas à consulta dos ativos |
| D32 | Registrar andamento confiável | Atualizar ação/ciclo e histórico atomicamente, confirmar alterações | Ausente no agente; mutação manual de execução usa chamadas separadas |
| D33 | Lembrar e escalar | Tratar silêncio, atraso, bloqueio, troca de responsável e pausa | Ausente |
| D34 | Revisar decisões do agente | Aprovar/rejeitar evidência, corrigir interpretação, retomar e orientar | Ausente como fila operacional |
| D35 | Monitorar aderência | Carteira por empresa, pessoa, setor, ativo e rotina, com prioridade de intervenção | Ausente na operação; cliente possui apenas demonstração |
| D36 | Monitorar consulta | Auditoria de perguntas, fontes, recusas, latência e feedback | Implementado; precisa medir entrega e recuperação além de geração da resposta |
| D37 | Fechar lacunas de conhecimento | Pergunta não atendida vira correção de ativo com responsável e retorno | Lista de auditoria existe; ciclo completo de resolução/retorno não encontrado |
| D38 | Qualidade do agente | Base de avaliação, meta, fontes certas, recusas e isolamento | Suite offline existe; fixtures esperadas não estavam na empresa usada; meta 85% não homologada nesta rodada |
| D39 | Medir impacto | Linha de base, execução, uso e nova percepção conciliam por pergunta | Relações e estimativas ainda ilustrativas |
| D40 | Revisar estimativas | Evidência, rubrica, amostra, confiança, aprovação e calibração posterior | Ausente |
| D41 | Saúde das integrações | Detectar token revogado, escopo, falhas de webhook, provedor e entrega | Logs e verificações parciais; faltam fila durável, reprocessamento e painel |
| D42 | Recuperação e auditoria | Repetir sem duplicar, saber sucesso/falha e rastrear alterações | Recibo Slack impede duplicação, mas também descarta retry após falha; sem estado de processamento |
| D43 | Privacidade e isolamento | Anonimato, escopo por empresa, retenção, transparência e trilha de acesso | Regras existem; bases pequenas e prospecção de percepção precisam tratamento antes da oferta integral |
| D44 | Operação e suporte | Runbook de implantação, revisão, falha, troca de pessoa e saída de cliente | Documentação técnica existe; procedimento operacional integral ainda precisa ser fechado |
| D45 | Homologação e manutenção | Migrações, testes atuais, piloto, restauração e aprovação da versão entregue | Unitários/build passam; E2E desatualizado e cobertura funcional insuficiente |

## Fluxos que precisam fechar de ponta a ponta

| Fluxo | Sequência e resultado necessário | Elo que ainda impede fechamento |
| --- | --- | --- |
| F1 — Implantação | Cadastro → acesso correto → Slack → setores/lideranças → preparação validada | Novos OAuth/acessos não homologados; acompanhamento DSC da implantação incompleto |
| F2 — Medição | Criar → ativar → distribuir → responder → conferir base → encerrar | Fluxo principal exercitado; falta atomicidade e política consistente de base pequena |
| F3 — Entrega | Fila DSC → análise → revisão → publicar → cliente → PDF | PDF divergente e rascunho de relatório exposto após publicação |
| F4 — Plano de ação | Selecionar → publicar → cliente → atribuir → persistir → exportar | Conversor por nome falha; UI demonstrativa; tabelas ausentes; exportação distinta |
| F5 — Ativos | Criar → revisar → publicar/indexar → cliente/consulta → nova versão → arquivar/restaurar | Tipos textuais têm base real; RACI e revisão operacional de validade incompletos |
| F6 — Acompanhamento | Ação + ativo + responsável → agente inicia → pessoa responde → evidência → atualização → gestor | Motor de execução proativa e supervisão ausentes |
| F7 — Aderência | Ciclo previsto → execução/evidência → exceção/validação → agregado por ativo/pessoa | Modelo de ciclos e cálculo real não existem |
| F8 — Consulta | App/Slack → busca da empresa → resposta com fonte/recusa → avaliação → correção da lacuna | Consulta real no app testada; Slack/retry e gestão da lacuna precisam fechamento |
| F9 — Resultado | Pergunta de origem → linha de base → ação/ativo/uso → estimativa revisada → nova coleta | Vínculos, evidências, rubricas e revisão ainda ausentes |
| F10 — Sustentação | Monitorar → detectar falha → corrigir/reprocessar → auditar → retomar | Fila durável, alertas e runbook integral faltam |

## Achados e lista de implementação em ordem de dependência

P0: bloqueia o objetivo confirmado ou apresenta como real uma entrega que não corresponde ao aprovado. P1: necessário para operar com confiabilidade e manter o cliente. A ordem abaixo é técnica; não representa calendário ou compromisso de prazo.

| Trabalho | Prioridade | O que fazer | Critério verificável de conclusão |
| --- | --- | --- | --- |
| A01 — Fonte única de Action Points | P0 | Trocar comparação por nome por ID estável; ligar página principal, API, relatório e PDF à seleção publicada; preservar coleta | Publicar uma ação gera exatamente uma ação em tela/exportação/API, inclusive com nomes completos das dimensões |
| A02 — Persistência de execução | P0 | Conciliar/aplicar migração de execução no ambiente; estado e histórico na mesma transação; tratar concorrência | Atribuir pessoa real, mudar etapa/prazo, recarregar em outra sessão e conferir eventos sem perda ou duplicação |
| A03 — Modelo de aderência | P0 | Persistir ativo ↔ ação ↔ pergunta, responsável, regra periódica/por evento, ciclos, evidências e exceções | Dados controlados reproduzem numerador/denominador e agregados; sem base não há percentual |
| A04 — Operação dos Action Points | P0 | Permitir à DSC criar/adaptar rotina, atribuir, definir expectativa, pausar e transferir com histórico | Cada item do cliente tem origem, responsável e acordo mantidos pela operação |
| A05 — Agente proativo | P0 | Agendador e fila durável, horário/fuso, abertura DM, contexto por ação, limite de tentativas, pausa e deduplicação | Agente inicia contato no momento devido uma única vez e não contata fora da regra/empresa |
| A06 — Conversa de execução | P0 | Distinguir consulta de relato; registrar evidência, bloqueio e progresso no item/ciclo correto, confirmar ação | Resposta real no Slack muda a ação correta e aparece no app com a mesma evidência |
| A07 — Supervisão e escalonamento | P0 | Lembrete, silêncio, atraso, bloqueio, revisão humana e fila DSC por cliente | Caso sem resposta e caso bloqueado seguem política e chegam ao gestor sem spam |
| A08 — Integridade do relatório | P0 | Uma fonte editorial para tela/PDF; snapshots de publicação e revisão separada; conciliar Action Points exportados; substituir achados fixos por leitura sustentada na base | Texto aprovado aparece no PDF; rascunho não altera versão visível; base uniforme não é descrita como desigual nem recebe causas não demonstradas |
| A09 — Indicadores verdadeiros | P0 | Remover dependência de exemplos das rotas operacionais; reconciliar identidades app/Slack e população elegível | Cada número abre base/período real; quem só está em liderança Slack entra no denominador correto |
| A10 — Resultado com evidência | P0 no escopo integral | Linha de base por pergunta/camada; vínculo ação/ativo; rubrica, evidência, confiança e revisão da estimativa; calibrar após coleta | Sem conversas/amostra suficientes mostra sinal insuficiente; estimativa identifica origem e aprovação e não substitui coleta |
| A11 — Operação da empresa | P1 | Persistir especialista principal; trocar preview por entregas reais; contato da entrega vem da atribuição | Mudar especialista e reabrir em outra sessão preserva atribuição; cliente vê contato correto |
| A12 — Ciclo completo de ativos | P1 | Habilitar produção de RACI prometida; homologar revisão/arquivo/restauração/concorrência e validade por todos os tipos; resolver timeout do conflito observado | Criar e manter cada tipo contratado; atualização troca somente a versão aprovada e a busca vigente; versão desatualizada responde 409 sem manter a pessoa aguardando indefinidamente |
| A13 — Coleta íntegra | P1 | Transação para sessão/respostas; testes de falha intermediária, duplicidade, prazo e encerramento | Falhar a gravação de uma resposta não deixa sessão concluída parcial; nova tentativa não duplica |
| A14 — Acesso e implantação | P1 | Homologar OAuth/convite; acesso/remover pessoa; gate consistente com preparação; recuperação real conforme método | Conta sem preparação recebe pendências corretas; token/convite expirado/revogado tem saída; recuperação não simula envio |
| A15 — Entrega e recuperação Slack | P1 | Estado recebido/processando/concluído/falhou, tentativas seguras e retorno de envio | Falhar depois de aceitar webhook permite reprocessar sem perder ou duplicar resposta |
| A16 — Base e privacidade | P1 | Definir limiar de agregação aprovado, público de cada leitura, consentimento/transparência e retenção | Uma resposta não expõe pessoa/camada indevidamente; estimativa/consulta respeitam o escopo combinado |
| A17 — Alertas, suporte e qualidade | P1 | Alertas reais, fila de lacunas com encerramento, saúde por cliente e runbooks; avaliação do agente em fixtures controladas | Falha tem responsável e recuperação; avaliação atinge meta com fontes/recusas verificadas; operador vê exceções |
| A18 — Homologação do produto | P1, saída | Atualizar E2E e completar matriz de papéis, empresas, temas, viewport público, falhas e reentrada | Jornada integral do piloto concluída sem P0/P1 abertos e com evidência de cada fronteira |

Iniciativas/projetos não substituem A01–A07. Se forem ofertados como parte do sistema de trabalho, precisam de persistência compartilhada, ferramenta real e sincronização; as prévias atuais não atendem esse contrato. Cobrança financeira, novos canais além de app/Slack e novas integrações de tarefas não foram adicionados como requisitos desta auditoria.

## Evidências de implementação e reprodução

| Evidência | Local e observação |
| --- | --- |
| Página de Action Points fictícia | `src/app/(app)/action-points/page.tsx`: chama `buildActionPointsAdherenceExample()` sem ler a seleção publicada |
| Dimensão não conciliada | `src/lib/data/action-plan-gantt.ts`: procura `item.name === template.dimension`; catálogo usa “Processos”, relatório usa “Processos e Execução Operacional” |
| Migração ausente | `supabase/migrations/20261009150000_action_point_execution.sql` existe localmente; `to_regclass` retornou nulo para as duas tabelas no banco conectado |
| PDF editorial divergente | `src/app/(app)/omdx/[id]/relatorio/route.ts`: só passa `report`; leitura nativa recebe `publication.report`; PDF de teste sem marcador editorial aprovado |
| Rascunho de relatório exposto | `src/lib/data/admin-delivery-data-source.ts`: `remainsPublished` mantém status publicada e sobrescreve report_content no upsert; marcador V2 de teste apareceu no cliente após intent save |
| Action Points PDF sem publicação | `src/app/(app)/omdx/[id]/action-points/route.ts`: só valida diagnóstico/plano; download respondeu 200 antes da entrega ser publicada |
| Impacto ilustrativo | `src/lib/data/omdx-analytics-overview.ts` chama `buildOmdxImpactExample`; `src/lib/data/omdx-impact-example.ts` usa deltas/uso/conversas fixos |
| Adoção não concilia liderança Slack | `src/lib/data/process-usage-data-source.ts`: conta organization_people + operational_members, sem organization_sector_slack_leaders; askerKey usa user_id ou external_user_id sem conciliação |
| Especialista da empresa não persiste | `src/components/admin/admin-company-detail.tsx`: handleSaveAssignment muda state; histórico usa getAdminCompanyOperationsPreview |
| RACI sem criação editorial | `src/lib/contracts/management-assets.ts`: editableManagementAssetTypeValues contém só sop/playbook/governanca |
| Agente atual é consulta | `src/app/api/integrations/slack/events/route.ts`: eventos seguem para answerAssetQuestion; não há atualização de Action Points ou agendador proativo |
| Retry sem recuperação | Recibo claimSlackEvent antecede after(); falha posterior só vai para log, reenvio é descartado pelo mesmo event_id |
| Escritas de coleta separadas | `src/app/api/omdx/responses/route.ts`: insere response_session concluída antes do insert das respostas, sem transação/rollback. Nenhuma sessão parcial foi encontrada na empresa de teste; é uma lacuna de recuperação, não uma perda observada nesta rodada |
| Recuperação simulada | `src/app/api/auth/reset-password/route.ts`: valida payload e devolve texto, sem serviço de recuperação |
| Histórico do chat | `src/components/ai-chat/ai-chat-workspace.tsx`: mensagens em useState; API recebe histórico do client; não há lista/carregamento durável de conversas |

## Registro dos testes e limites

As mutações ficaram restritas a dados fictícios identificados como auditoria dentro da empresa autorizada. Não houve alteração de permissões, configuração global do Slack, deploy ou correção de código de produto. Foram produzidos dois diagnósticos fictícios, uma entrega publicada e três ativos textuais; a alteração de rascunho do relatório foi restaurada ao conteúdo V1 de teste. Os registros de auditoria foram preservados para revisão; as duas coletas foram encerradas. A nova versão 2 do Playbook e o rascunho do SOP são dados de teste, não revisões de documentos anteriores da empresa.

As chamadas integradas de API usam sessões de teste emitidas localmente para os papéis já existentes e consultam o banco configurado. Isso testa autorização/fluxo, mas não é evidência de um novo login Google. A interface cliente usa a sessão real já aberta. O webhook do Slack em um servidor público não chega diretamente a localhost; eventual injeção assinada de teste precisa ser identificada como tal e não como recebimento externo natural.

| Teste executado | Resultado e limite |
| --- | --- |
| Unitários | 50 arquivos, 330 testes aprovados |
| TypeScript | `npx tsc --noEmit` aprovado |
| Lint | `npm run lint` aprovado |
| Build | `npm run build` aprovado; valida compilação, não operação em produção |
| E2E existentes | Primeira rodada: 3 passaram, 2 falharam. Reexecução apenas do admin com timeout 120s passou em 34,6s. A outra falha espera “Coletas” e biblioteca antiga; o teste está desatualizado. A suite completa não ficou verde |
| Verificações dirigidas | 64 casos de API/integração registrados: 58 aprovados, 5 falhas de comportamento esperado e 1 conflito sem resposta em duas tentativas. São cenários direcionados, não cobertura exaustiva do inventário |
| Sessão e autorização | Sem sessão: 401 em quatro APIs. Cliente tentando criar ativo administrativo: 403. Fronteira do superadmin passou no teste isolado. Ativo de outra empresa: 404 |
| Criação/ativação | Pesquisa criada e ativada na interface real; três links gerados |
| Base de coleta controlada | Fundador = 4, liderança = 3, operação = 2 em todas as 30 perguntas. Banco: 3 sessões, 90 respostas, média 3,0. Leitura nativa: camadas 4,0/3,0/2,0 e seis dimensões 3,0 |
| Respostas inválidas/duplicadas | Conjunto incompleto: 400; repetição com cookie do mesmo navegador: 409 |
| Encerramento e publicação | Encerramento: 200; relatório antes da publicação: 404; publicação editorial administrativa: 200; cliente lê texto aprovado |
| Exportações | Relatório PDF: 200, 38.084 bytes, 9 páginas; CSV: 200. Extração do PDF não contém marcador editorial aprovado; primeira página renderizada e inspecionada |
| Action Points | PDF respondeu 200 antes da publicação; página principal mostra exemplo em vez da seleção; atualização da ação selecionada respondeu 404 |
| Revisão de relatório | `intent=save` com marcador V2 manteve status publicada e mostrou o marcador ao cliente, sem nova publicação. Conteúdo de teste restaurado para V1 |
| Ativos textuais | SOP, Playbook e Governança: criar 201; rascunho oculto 404; salvar 200; publicar antes de revisão 409; revisar/aprovar/publicar 200; ler 200; chunks presentes |
| RACI | Criar pelo mesmo fluxo: 400. Contrato administrativo exclui o tipo, apesar de existir na superfície cliente |
| Revisão de ativo | Novo rascunho do SOP aberto e editado; conteúdo não publicado permaneceu oculto no cliente |
| Edição pelo dono | Playbook atualizado com sucesso; versão 2 aparece inclusive nas fontes do agente. Reenvio de versão antiga sem resposta em duas verificações de 65s; não foi homologado o tratamento de conflito |
| Agente API | Pergunta fictícia recebeu código/prazo corretos e fonte do ativo de teste; feedback útil: 200 e persistido; pergunta sem informação publicada recebeu recusa sem citações |
| Agente interface | Pergunta enviada pela sessão real, resposta exibida e três fontes fictícias corretas, incluindo versão 2. Desktop light/dark inspecionado |
| Slack local | Sem assinatura: 401; evento sintético assinado: 200 em 464ms; auditoria respondida com três citações e mensagem do bot confirmada no histórico do DM autorizado |
| Formulário público mobile | Viewport confirmado 375 × 812, scrollWidth 375; light/dark; 30 opções preenchidas; envio real; 1 sessão com 30 valores 4 no banco; página Obrigado confirmada |
| Adoção e população | Empresa de teste tem 1 liderança Slack, 0 organization_people ativos e 0 membros operacionais aprovados. A população lida pelo indicador atual resulta em zero, embora haja uma liderança que usa o Slack |

Detalhes das verificações de API estão em `auditoria-operacao-integral-2026-10-18-evidencias.json`. São evidências de casos específicos; contagem de casos aprovados não é percentual de prontidão do produto.

Não homologados: novo Google OAuth, aceite/revogação de convite, campanha/cadastro completo, recuperação real, criação/remoção de setor, alteração completa de categorias, ciclo de arquivo/restauração, menções/continuação de thread/interação de feedback Slack, recuperação de falha de webhook, avaliação offline completa de 85%, carga sustentada, backup/restauração, produção e piloto acompanhado. Não se deve concluir que esses caminhos funcionam ou falham apenas por inspeção de código.

A atualização de versão antiga teve timeout reproduzido; a causa específica ainda exige diagnóstico. Consultas de atividade mostraram RPCs em execução e espera de lock, mas isso não comprova por si só a causa raiz. O código usa erro SQL 40001 para conflito de versão; não foi executada alteração de função, cancelamento de sessão ou correção nesta auditoria.
