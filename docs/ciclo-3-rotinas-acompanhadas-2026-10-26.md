# Ciclo 3 — Rotinas acompanhadas

Início autorizado por Don em 26/10/2026. Primeira entrega: A04, operação de rotinas. Consulta normal do Slack já aprovada no ciclo anterior; não foi repetida. As três perguntas autorizadas anteriormente já foram consumidas. Contato proativo exige uma proposta concreta de participantes, janela e mensagem; não foi ativado nesta entrega.

## Alterações

- A consulta ao diretório descarta pessoas da leitura anterior, ignora respostas atrasadas de consultas anteriores e mantém os campos em caso de erro.
- Criar/revisar exige que o responsável esteja presente no diretório atual. Transferência exige outra pessoa disponível e preserva motivo/seleção em conflito.
- Gravação confirmada seguida de falha de leitura bloqueia novas alterações nas rotinas até Atualizar dados concluir. A lista anterior continua visível e o aviso distingue gravado de não confirmado.
- Atualização manual tem estado próprio e impede edição concorrente.
- Nova rotina explica os pré-requisitos ausentes: action point publicado, ativo publicado e setor ativo.
- A hipótese inicial de troca indevida de fuso foi descartada: o contrato dos acordos aceita somente São Paulo. Nenhuma mudança no contrato.

Sem nova API, migração, dependência, deploy ou envio externo. Os fluxos existentes de criação, pausa, retomada e transferência foram preservados.

## Revisão de Don

Em Empresas → empresa de teste → Operação das rotinas, conferir os avisos e os campos preservados após erro. A revisão integrada de transferência precisa de duas pessoas autorizadas; as capturas desta entrega usam duas pessoas fictícias. Não é necessário repetir o piloto de consulta do Slack.

## Verificação local desta entrega

- 12 testes unitários em três arquivos: API administrativa, fonte de dados de rotinas e acordos exibidos ao cliente.
- 8 cenários de navegador aprovados: falha do diretório, responsável indisponível/transferência em conflito, falha ao reler uma gravação e pré-requisitos ausentes, nos temas claro e escuro.
- TypeScript (`npx tsc --noEmit`) e lint completo (`npm run lint`) aprovados. Tipos de rotas regenerados após remover a rota temporária de teste.
- Capturas desktop conferidas; evidências em `docs/evidencias/ciclo-3-2026-10-26/index.html`.

Os testes de navegador usam componentes reais com dados fictícios e APIs interceptadas. Não comprovam persistência integrada, transferência real, agendamento ou contato Slack. Build de produção não foi executado nesta rodada. A04 permanece em desenvolvimento; V03 ainda aguarda o fluxo integrado e o aceite.

## Continuação do ciclo

A09: identidade e indicadores reais. A05: proposta e configuração do acompanhamento, prévia da mensagem e validação da agenda/consumidor. A06: confirmação de relatos e evidência. A07: revisão e exceções. A18/V03: fluxo integrado. Recuperação e consumidor periódico do C2 permanecem pendências técnicas, não são declarados concluídos por esta interface.
