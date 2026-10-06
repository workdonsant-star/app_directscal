# Design QA — Projetos, opção 2

Data: 04/10/2026. Resultado: **passed** para a interface de demonstração, com adaptações explícitas aos contratos do repositório. Sem questões P0, P1 ou P2 abertas neste recorte.

## Referência e normalização

Referência selecionada pelo usuário: opção 2, em `/Users/donsantos/.codex/generated_images/01a106ae-a0ab-72e1-a4c6-88c17a6877af/exec-7e0f66a6-175f-4926-b6fb-7ca94d26e0bf.png` (1487 × 1058 pixels).

A imagem gerada tem topbar de aproximadamente 65px e sidebar de 297px. Foi redimensionada uniformemente para 1280 × 911 pixels, normalizando a escala para o shell existente de 56px/256px. Não se alterou o shell para reproduzir a ampliação raster da referência. Screenshot do navegador em 1280 × 911 pixels, sem zoom, mesma rota, estado inicial, tarefa e tema claro. A sessão é fictícia: Marina Lopes / Vertex Logistics.

Rota: http://localhost:3000/iniciativas/novo-website. Estado: Precisam de atenção selecionada, duas intervenções, três tarefas em acompanhamento, sem painel aberto e sem mutações de teste preservadas.

## Evidências conjuntas

Pasta de evidências desta execução: `/private/tmp/directscal-project-interface/`.

- `reference-normalized.png`: referência na escala do shell.
- `comparison-initial.png`: referência e primeira implementação no mesmo canvas, mostrando densidade excessiva e indicador da aba oculto.
- `comparison-final.png`: comparação conjunta final, referência à esquerda e implementação à direita, canvas 2560 × 943px (faixa superior identifica as imagens).
- `comparison-focused.png`: comparação conjunta das intervenções e do acompanhamento, 1920 × 667px. Recortes equivalentes de x=285, y=245, largura=960, altura=635.
- `version2-light.png`: implementação final no tema claro, 1280 × 911px.
- `version2-dark.png`: implementação no tema escuro, 1280 × 911px.
- `version2-mobile.png`: tema escuro em 375 × 812px.

A referência e a implementação foram inspecionadas **juntas** nas duas composições finais. A revisão não dependeu de lembrança visual de imagens separadas.

## Achados corrigidos

| Prioridade | Achado | Correção e evidência |
| --- | --- | --- |
| P2 | Indicador da aba ficava fora da área visível devido à variante horizontal do primitive. | Override com a mesma variante horizontal; sublinhado visível na comparação final. |
| P2 | Espaçamento das intervenções e altura das linhas empurravam o acompanhamento e o rodapé para fora do viewport normalizado. | Reduzidos espaçamentos, corrigida margem em controles posicionados e ajustada densidade da tabela. As cinco tarefas e o rodapé aparecem no screenshot final. |
| P2 | Texto azul no escuro tinha contraste insuficiente (aproximadamente 3,75:1). | A área do projeto usa o highlight azul existente no tema escuro; tokens locais de pendência e confirmação têm contraste superior a 6:1 no claro e 8:1 no escuro. |
| P2 | Link renderizado pelo Button gerava aviso do Base UI sobre nativeButton. | Composição ajustada para nativeButton=false; nenhuma nova mensagem de erro ou aviso na repetição final da aba Ativos relacionados após recarga. |
| P2 | Edição do campo nativo de data/hora não atualizava o formulário no navegador de validação. | Usado onInput; botão Salvar alterações aparece, ajuste é registrado e prazo original permanece no painel. |

## Adaptações deliberadas e diferenças pequenas

- Fontes, tokens, topbar e sidebar seguem o shell real Symbach. A imagem gerada é uma referência de composição, sem substituir os contratos existentes.
- Ícones de intervenção são Lucide sem fundos ornamentais, conforme AGENTS.md. A tabela usa apenas seu próprio wrapper arredondado com borda, também conforme a regra local.
- CTA principal mantém o token existente do botão; badges usam tokens semânticos locais. Não foram alterados tokens globais ou o design system canônico.
- O botão discreto Editar projeto preserva o acesso ao formulário anterior.
- O rodapé informa Dados de demonstração / Sem ferramenta conectada. A legenda fictícia de sincronização com ClickUp da imagem não foi implementada.
- Espaçamento fino, forma dos indicadores de tarefa e proporções dos badges diferem levemente do raster (P3). Não afetam hierarquia, leitura ou controles.
- O indicador de desenvolvimento do Next aparece em screenshots locais; não é componente do produto.

## Interações verificadas

1. Ver critérios abre a tarefa; Aprovar entrega permanece desabilitado antes da conferência dos três critérios. Após aprovação, a tarefa sai da fila e a quantidade de intervenções muda.
2. Resolver bloqueio exige descrição; a tarefa volta ao acompanhamento com Bloqueio resolvido, mantendo Em andamento.
3. Prazo alterado de 05/10 às 18h para 19h30 foi salvo explicitamente; prazo original e registro com autor/horário permanecem no painel. A confirmação anterior é removida.
4. Comentário aparece no histórico da tarefa com autor e horário.
5. Busca por Rafael retorna duas tarefas; consulta inexistente mostra estado vazio.
6. Nova tarefa cria Validar navegação do site, com executor e prazo, limpa a busca e aparece na lista com seis tarefas.
7. Abas Atividade e Ativos relacionados abrem os estados previstos. Consultar agente permite alternar intervenção, prazos e últimas atualizações, com indicação de demonstração.
8. Editar projeto abre o formulário existente com o contrato local; fechamento por Cancelar preserva os dados. Não foi necessário editar dados cadastrados para esta validação.
9. Novo aplicativo abre vazio e não herda tarefas ou decisões de Novo website. Recarregar retorna as cinco tarefas originais da demonstração.
10. Temas claro e escuro verificados em desktop. Em 375px, documento e body têm largura de 375px, sem overflow horizontal da página; abas e tabelas têm rolagem local quando necessário.

Após os ajustes, a navegação para Ativos relacionados foi repetida após recarga e o log foi filtrado pelo horário de início dessa repetição: nenhum erro ou aviso novo. Verificação manual de estados e screenshots, sem suíte E2E automatizada nesta entrega.

## Validação técnica e limites

- `npx tsc --noEmit`: passou.
- `npm run lint`: passou.
- Sem dependências adicionadas ao projeto. Prettier foi executado temporariamente com cache fora do repositório.
- Build de produção e suítes unitária/E2E não foram executados; a validação utilizou o servidor de desenvolvimento já aberto pelo usuário.
- Tarefas, comentários, aprovação e ajustes existem apenas em estado React. Metadados das iniciativas preservam o armazenamento local anterior. Não há escrita em banco, ferramenta externa, mensagens ao Slack, cron, modelo de IA ou deploy.
- Nenhuma conclusão sobre dados, permissões ou integrações reais de produção foi tirada desta sessão fictícia.

## Documentação

Especificação: `docs/experiencia-agentica-projetos-e-action-points.md`, seção 15. Documentação local atualizada nas pastas de componentes, contrato de iniciativas e rotas. Decisão e requisito futuro de acompanhamento proativo registrados e relidos no [Notion — Symbach, Shell e iniciativas](https://app.notion.com/p/3ee026c1ddec81cea86fc7cc73cda7e5).

## Atualização da referência — tabelas e seletores (04/10/2026)

O usuário forneceu o frame `252:2` do Figma DirectScal App como nova referência para todas as próximas tabelas e botões seletores. Foram lidos o frame, o componente de tabela `252:438`, os seletores `252:79` e suas variáveis. Esta referência substitui apenas os padrões de tabela e abas da comparação anterior: a borda externa e o sublinhado daquela entrega não são mais o padrão aprovado.

Implementadas `Table variant="operational"` e `TabsList variant="selector"`; aplicadas ao detalhe do projeto. Variantes legadas preservadas. Colunas e indicadores representam tarefas; perguntas, pontuações e status de maturidade do exemplo Figma não foram usados como conteúdo do projeto.

Evidências em `/private/tmp/directscal-table-standard/`: `table-reference.png`, `selector-reference.png`, `table-implementation.png`, `selector-implementation.png`, `comparison-components.png`, `project-light.png` e `project-dark.png`. A tabela de referência foi normalizada de 1024px para seus 1584px de largura; comparou-se o cabeçalho e a primeira linha, 99px de altura. Os seletores foram comparados a 568 × 32px, lado a lado no mesmo canvas. Os componentes foram inspecionados juntos.

Valores conferidos no DOM a 1920 × 1000px: cabeçalho de 44px, quatro cantos externos de 5px, linhas de 55px, divisórias inferiores de 0,5px, header claro rgb(250,250,250), seletor ativo rgb(244,244,244), altura de 32px e gap de 32px. Foi corrigida a correspondência entre as superfícies do Figma e os tokens atuais: header `bg-secondary`; seletor ativo `bg-muted`. Nenhum token global foi alterado. No tema escuro, usam as superfícies existentes rgb(28,28,32) e rgb(38,38,38).

Uma linha sob o ponteiro permaneceu transparente. Navegação por ArrowRight seguida de Enter ativou Todas as tarefas; clique retornou a Precisam de atenção. Abertura e fechamento da tarefa preservaram o painel. Temas claro e escuro inspecionados em desktop, sem overflow horizontal da página. Nenhum fluxo de decisão ou integração foi alterado. Fonte renderizada, textos e larguras de coluna diferem conforme o domínio; a pequena diferença de largura da opção ativa decorre do contorno transparente de foco do primitive Base UI.

TypeScript e lint passaram. Revisão dos componentes React preservou semântica, estados, props e foco; sem hooks ou dependências adicionais. Nenhum teste unitário foi criado para reproduzir classes CSS. A verificação desta alteração usa o servidor de desenvolvimento, sem build de produção, integração externa ou deploy. Regras atualizadas em `AGENTS.md`, instruções locais e `docs/padroes-de-tabelas-e-seletores.md`; registro no Notion acompanha a página citada acima.


## Correção — duas tabelas na aba Precisam de atenção (04/10/2026)

Nova leitura do frame `252:2` e dos grupos `252:246` e `252:517` confirmou duas tabelas: Situações que precisam de você (`252:438`) e Em produção (`252:523`). A implementação anterior havia mantido a primeira seção em artigos; agora ambas reutilizam `TaskTable` e o primitive operacional. Títulos seguem a referência, com 20px entre descrição e tabela e 40px entre seções. Nenhum ativo estático aparece nesses dois grupos.

Mantidos os campos próprios do domínio: tarefa, executor, prazo e acompanhamento. O clique na tarefa pendente abre critérios de aprovação ou resolução de bloqueio no painel existente. O motivo e o histórico permanecem no painel. Cada tabela tem nome acessível; o estado vazio da primeira informa Nenhuma situação precisa de você.

Evidências em `/private/tmp/directscal-two-tables/`: `reference.png`, `comparison.png`, `project-light.png` e `project-dark.png`. Referência e implementação foram inspecionadas juntas, normalizadas para 1024px de largura a partir do viewport de 1920px. O Figma contém um registro de exemplo por tabela; o app contém duas pendências e três tarefas em produção, por isso a altura total e a posição vertical da segunda seção crescem com os dados. Não foram reproduzidos campos de pergunta e pontuação do exemplo. Diferenças pré-existentes do shell, avatar e conteúdo da sidebar permanecem fora do escopo.

Conferidos dois elementos table, cabeçalhos de 44px e linhas de 55px, claro e escuro no desktop, sem overflow horizontal da página. Aprovação permaneceu desabilitada antes da conferência dos critérios; ao aprovar, a tarefa saiu das pendências e não entrou em produção. Resolução do bloqueio abriu com foco no campo e moveu a tarefa para Em produção, mantendo execução. Após as duas ações, a primeira tabela apresentou seu estado vazio. Recarga restaurou os cinco exemplos e a revisão final ficou sem mutações de teste.

TypeScript e lint passaram. Alteração limitada ao componente do projeto e sua documentação, sem nova dependência, API, integração, escrita externa de tarefa ou deploy. Documento funcional e registro no Notion atualizados para a estrutura de duas tabelas.


## Executor com foto — referência fornecida em 04/10/2026

A coluna Executor recebeu avatar circular de 32px ao lado do nome, com gap de 8px, conforme a referência de fotos enviada pelo usuário. Reutilizados Avatar, AvatarImage e AvatarFallback. Aplicação nas duas tabelas de Precisam de atenção e na lista Todas as tarefas. O modelo atual tem um executor por tarefa; não foram adicionados executores fictícios para reproduzir o grupo de três pessoas da imagem.

As cinco tarefas usam quatro fotos ilustrativas locais de 96px, sem chamadas externas em tempo de execução. Rafael conserva a mesma foto nas duas tarefas. Nome ausente de foto usa iniciais; uma tarefa de teste com Beatriz Lima apresentou BL e foi removida pela recarga da demonstração. O nome textual permanece acessível e o avatar é decorativo. Nenhuma resolução de identidade real por nome foi adicionada.

Verificação em claro e escuro a 1280 × 1000px; imagens carregadas e recortadas em 32 × 32px. Reduzido o padding vertical da célula Executor para acomodar a foto sem ampliar a linha: todas as linhas permaneceram com 55px. Cinco fotos conferidas em Todas as tarefas e nas duas tabelas iniciais. Sem overflow horizontal da página. Evidências: `/private/tmp/directscal-project-avatars-light.png` e `/private/tmp/directscal-project-avatars-dark.png`. TypeScript e lint passaram; sem dependências, integração, dados de produção ou deploy.

## Progresso e tomada de decisão — referência de 04/10/2026

Referências enviadas pelo usuário: imagem de logs `Captura de Tela 2026-10-04 às 09.11.59.png` e painel anterior `codex-clipboard-c3ae26fe-9d88-42eb-ac39-e592736afd1f.png`. A referência de logs orienta a anatomia, sem copiar os eventos de autenticação ou informações pessoais dos exemplos.

O painel abre em Progresso, com linha do tempo de conector fino, círculos com contorno, autor/ação, descrição, categoria, origem e horário. Uma pendência mostra contexto e CTA; a aba Tomada de decisão fica vermelha, também com ícone e texto. Detalhes concentra os controles de status e prazo. As tabelas e os seletores aprovados foram preservados. O painel usa até 672px no desktop e ocupa 375px no mobile; as abas têm rolagem local.

Na decisão, o líder escolhe orientação, adiamento, suspensão ou call e escreve sua instrução. Preparar não altera a tarefa. A proposta mostra o efeito e as duas comunicações, permitindo editar ou confirmar. Depois de confirmar, o histórico e a Atividade distinguem decisão registrada, comentário preparado e mensagem preparada; as comunicações exibem Prévia / Não enviado.

Verificado no navegador local:

1. Solicitar call manteve status, prazo e bloqueio; nenhuma reunião foi criada. A proposta conservou o estado anterior até a confirmação e o histórico recebeu os três eventos.
2. Suspender manteve o prazo, retirou a tarefa das duas tabelas iniciais e a conservou em Todas as tarefas como Suspensa. Retomar em Detalhes reapresentou Bloqueio informado.
3. Alterar status em Detalhes sem salvar impediu preparar decisão; Voltar a Detalhes preservou o valor e permitiu salvar.
4. Adiar de 06/10 às 12h para 07/10 às 15h conservou o compromisso original no painel. O bloqueio permaneceu até a resolução explícita.
5. Registrar acesso liberado retirou o bloqueio e colocou a tarefa em produção sem concluir. Aprovar identidade visual ficou desabilitado antes de conferir os três critérios e depois concluiu a tarefa.
6. Claro e escuro verificados a 1280 × 1000px; rolagem local, linha do tempo, área de decisão e campos conferidos. O fundo do painel usa bg-background: evita contraste insuficiente dos textos vermelhos sobre o popover escuro atual. Contraste calculado de 5,41:1 do sinal vermelho sobre o fundo escuro e 4,96:1 sobre a superfície com tint de 10%.
7. ArrowRight e Enter ativaram Detalhes. Em 375 × 812px, documento com 375px de largura, painel com 375px e conteúdo com 374px, sem overflow horizontal da página.

Evidências: `/private/tmp/directscal-task-progress-light.png`, `/private/tmp/directscal-task-progress-dark.png`, `/private/tmp/directscal-task-decision-preview-light.png`, `/private/tmp/directscal-task-decision-dark.png` e `/private/tmp/directscal-task-decision-mobile.png`. A recarga restaurou os cinco exemplos; nenhuma mutação de teste foi mantida.

TypeScript, lint e sete testes unitários em `tests/unit/project-decisions.test.ts` passaram. Os testes cobrem compromisso original, pendência preservada, suspensão distinta de conclusão, comunicações simuladas, prazo inválido e proposta desatualizada. Revisão React manteve estado derivado, eventos explícitos, sem effects/memoização ou dependências novas. Build de produção, suíte E2E e integrações reais não foram executados. Não houve API, banco, modelo de IA, envio externo, cron ou deploy. Documento funcional atualizado na seção 17 e entrega registrada no Notion.
