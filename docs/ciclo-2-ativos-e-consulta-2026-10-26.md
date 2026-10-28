# Ciclo 2 — Ativos e consulta

Início autorizado por Don em 26/10/2026 após revisão de C1. Essa autorização permite avançar; não encerra a pendência A08 nem comprova implantação/proteção de base do ciclo anterior. Nenhum ciclo 3 foi iniciado.

## Escopo e implementação desta rodada

- **A11:** atribuição principal e contato publicado já implementados. Regressão de API e contato, mais interface com seleção preservada após erro. Corrigida documentação local antiga que ainda dizia estado local.
- **A12:** fila de revisão, periodicidade e RACI já implementadas. Verificados modelo, indexação, prazo, conflito/isolamento e interface com erro preservando a matriz. Não reescrito ciclo editorial.
- **A15:** API de metadados/recuperação existia sem interface. Novo SlackDeliveriesPanel no detalhe da empresa, carregamento sob demanda, paginação, erro preservando lista, estados claros e confirmação antes de recuperar falha. Incerto não recebe reenvio. Falha com tentativa automática respeita a janela. Resultado desconhecido do POST trava nova tentativa até releitura. Encerrado sem envio não aparece como Entregue.
- **F07:** leitor oferece Consultar agente via runtime, sem recolocar item na sidebar e sem enviar automaticamente uma pergunta. Guias explicam fonte, versão, feedback, recusa e erro técnico.
- **F09:** /docs atualizado para nomes atuais, novo /admin/guia com passos operacionais. Links no agente e no detalhe da empresa. Removido Alertas sem ação da topbar, preservando ações e controles da demo.

Nenhuma dependência adicionada, migração executada, conexão Slack alterada ou consumidor ativado. A implementação permanece local, sem commit ou deploy nesta rodada. O piloto Slack posterior, autorizado separadamente, está registrado abaixo.

## Verificação

Resultados e capturas em `evidencias/ciclo-2-2026-10-26/`. Suíte `tests/e2e/cycle-two.spec.ts` monta componentes reais com fixtures e intercepta todas as APIs; não comprova persistência, autenticação, resposta do modelo ou entrega externa. Os testes de contrato/serviço usam substitutos e não acessam banco real. Evidências anteriores de SQL/integração não foram reapresentadas como execução nova.

Resultados desta rodada:

- 103 testes unitários direcionados passaram em 16 arquivos (lotes de 55 e 48); não é a suíte unitária completa.
- 16 cenários de navegador passaram em temas claro e escuro, incluindo erro, conflito, paginação, fonte e recuperação sem repetição cega.
- `npx next typegen`, `npx tsc --noEmit` e `npm run lint` passaram após remover a rota temporária de fixture.
- `npm run build` passou; a primeira tentativa sem rede falhou ao baixar Google Fonts, e a repetição com rede concluiu.
- A rota temporária de verificação não faz parte da entrega. Reprodução descrita em `tests/e2e/fixtures/CLAUDE.md`.
- Capturas inspecionadas em claro e escuro. O teste de contato publicado usa props fixas; a persistência entre sessões segue no roteiro integrado.

Roteiro concreto: `guia-operacao-ciclo-2.md`. Manuais de uso não incluem segredos nem detalhes de infraestrutura.

## Limites para fechamento de C2

- Implantar a versão e configurar/verificar o consumidor periódico em ambiente autorizado.
- Revalidar o fluxo editorial e a troca de especialista com sessões normais e persistência real no ambiente de homologação.
- Homologar instalação/menção/DM/thread, fonte, feedback e recuperação com um workspace/canal de teste autorizado. Não repetir envio incerto.
- Obter revisão V02 com versão e ambiente identificados. A passagem para C2 não constitui esse aceite.

Tarefas: A11, A12, A15, F07, F09; validação V02 no Notion. Revisão visual preparada e implantação são estados distintos.

## Piloto autenticado posterior às fixtures

A conta fornecida pelo usuário entrou pelo login normal como cliente. A seção Slack confirmou a instalação conectada. Sem cookies fabricados, troca de papel ou leitura direta com service role.

- Consulta real pelo app sobre o procedimento fictício Violeta: HTTP 200, resposta com código e prazo corretos, fontes publicadas na versão 1.
- Leitura autenticada do SOP citado: HTTP 200, código e prazo conferidos.
- Avaliação Útil da própria resposta: HTTP 200.
- Pergunta fictícia fora do acervo: HTTP 200 com insufficient_evidence e nenhuma citação.
- Histórico autenticado: as duas consultas novas reapareceram com os respectivos estados e fontes.
- A primeira solicitação de envio Slack foi rejeitada pela revisão automática por falta de autorização explícita para a conversa direta escolhida. O usuário depois confirmou o destino e autorizou até três perguntas fictícias. O piloto abaixo começou somente após essa confirmação.

Esse piloto parcial não substitui publicação/republicação integrada, entrega Slack, recuperação real ou validação do consumidor. Não registrar e-mail, senha, cookies ou identificadores de clientes nos artefatos.

## Piloto real no Slack — 26/10/2026, 09h46–09h49 (Brasília)

Após autorização explícita para até três perguntas na conversa direta existente com o bot, foram enviadas exatamente três perguntas fictícias pelo conector Slack.

| Caso | Resultado observado | Tempo aproximado | Fila |
| --- | --- | --- | --- |
| Procedimento Violeta | Código e prazo corretos, fontes SOP/governança na versão 1 | 44 s | Concluído, uma tentativa |
| Continuação na thread | Resposta na mesma thread: dois dias úteis; fontes SOP/governança v1 e playbook v2 | 32 s | Concluído, uma tentativa |
| Pergunta fora do acervo | Ausência de informação reconhecida, sem fonte inventada | 30 s | Concluído, uma tentativa |

Conferência em leitura no banco confirmou que as versões citadas eram as publicações vigentes. Cada registro de entrega conservou o timestamp da resposta correspondente no Slack, sem erro e sem retry. Nenhuma duplicação foi observada na conversa e na thread durante esta janela. Metadados resumidos, sem identidade ou conversa pessoal, em `evidencias/ciclo-2-2026-10-26/slack-pilot.json`.

Esta prova confirma o ingresso real, processamento e confirmação do caminho imediato nas três perguntas. Não comprova consumidor periódico, recuperação após indisponibilidade, menção em canal ou clique real nos botões de feedback do Slack. Nenhuma configuração, conexão ou implantação foi alterada para o piloto. A15/F07/V02 permanecem abertos para os itens restantes.
