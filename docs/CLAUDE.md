# `docs` — Especificações de produto e arquitetura

Antes de editar arquivos nesta pasta, releia o `AGENTS.md` da raiz.

## Propósito

Esta pasta registra decisões de produto, especificações funcionais e propostas de arquitetura que ainda não pertencem à documentação operacional de uma pasta de código específica.

## Convenções

- Escreva em português do Brasil, com linguagem consultiva, direta e operacional.
- Diferencie explicitamente decisão aprovada, hipótese, fase futura e item fora de escopo.
- Não apresente uma proposta documentada como funcionalidade já implementada.
- Vincule entidades novas aos contratos e limites atuais do produto.
- Inclua critérios de aceite verificáveis para cada fase de implementação.
- Não registre segredos, tokens, identificadores reais de clientes ou dados pessoais.
- Quando a implementação começar, atualize também os `CLAUDE.md` das pastas de código afetadas.


- `shell-e-iniciativas.md` registra a portabilidade da interface Symbach, o ponto de preservação no Git e a validação local.
- `experiencia-agentica-projetos-e-action-points.md` reúne o estudo funcional com foco no gestor e o requisito confirmado de acompanhamento proativo pelo Slack, com atualização da tarefa na ferramenta do cliente. Diferencia decisões de produto, propostas de interface e capacidades ainda não implementadas.
- A seção 15 de `experiencia-agentica-projetos-e-action-points.md` registra a escolha da opção 2 e a implementação frontend de projetos, distinguindo demonstração, armazenamento de metadados e futuras integrações. `design-qa.md` na raiz reúne a comparação visual e o escopo de verificação.
- `padroes-de-tabelas-e-seletores.md` registra a referência Figma de 04/10/2026 e as variantes compartilhadas obrigatórias para novas tabelas e botões seletores. Substitui a orientação anterior de wrapper de tabela com borda; o projeto é o primeiro consumidor.
- A seção 17 de `experiencia-agentica-projetos-e-action-points.md` registra progresso em linha do tempo, decisão com revisão e os efeitos de adiar, suspender, solicitar call e orientar. Diferencia comunicação simulada da futura execução nas ferramentas do cliente e no Slack.
- `vistoria-fechamento-produto-2026-10-07.md` registra a vistoria do código, do banco conectado e de telas locais, com inventário de valor, lacunas e dez pacotes de fechamento. É uma proposta com critérios de aceite; não representa correções executadas nem homologação completa de produção. As três imagens `vistoria-2026-10-07-*.png` mostram uma conta fictícia local.

- auditoria-nomes-e-fotos-2026-10-09.md registra a causa da divergência entre navegadores, a persistência de perfis/especialistas, testes com sessões independentes e a distinção entre migração aplicada e deploy pendente.

- A seção 18 de `experiencia-agentica-projetos-e-action-points.md` registra a decisão de 09/10/2026: action points executados pelo agente no Slack, com responsável escolhido entre as pessoas do workspace, etapas, cadência e fases (base implementada; acompanhamento ativo pendente).

- `tokens-de-cor.md` registra a escala de superfícies de 18/10/2026 (shell, canvas, card, control, popover, field, selected), igual nos dois temas, e as regras de hierarquia por fundo em vez de borda.

- `tokens-de-tipografia.md` registra as famílias e escalas de 18/10/2026, separadas entre interface (`ui-*`) e documentos dos ativos de gestão (`doc-*`), com leitor e editor na mesma escala.

- `analytics-impacto.md` registra a decisão de 18/10/2026 de medir o impacto dos ativos e dos action points pela nota estimada pelo agente entre coletas, os cuidados (anonimato, LGPD, cansaço, viés), o que está plotado hoje no Analytics e as dependências para dado real.

- `auditoria-operacao-integral-2026-10-18.md` registra o escopo confirmado para um cliente operar integralmente: inventários de cliente e operação DirectScal, aderência em três camadas, acompanhamento proativo obrigatório, testes locais com dados fictícios e plano de fechamento com critérios de aceite. Diferencia implementação, demonstração, falha comprovada e capacidades não homologadas; não representa correções ou homologação de produção.


fechamento-operacional-2026-10-19.md registra o primeiro lote de implementação (A01/A02/A08 e início de A09), migrações aplicadas, testes locais e limites de validação.

A continuação de 20/10 em `fechamento-operacional-2026-10-19.md` registra A12: ciclo dos quatro tipos, causa/correção do conflito, busca vigente, validade e limites da homologação.

`modelo-de-aderencia.md` registra a base A03 implementada: acordos/oportunidades/fatos imutáveis, denominadores, exceções e limites entre evidência manual, autoria Slack, operação A04 e automação A05/A06.

A04: modelo-de-aderencia.md e fechamento-operacional-2026-10-19.md registram operação administrativa, leitura do acordo pelo cliente, testes concorrentes e limites de revisão visual/transferência real.

entrega-duravel-slack.md registra estados, recuperação, runbook, acesso, privacidade e limites da prova A15. after() não substitui o consumidor periódico; envio incerto exige revisão humana.

identidade-app-slack.md documenta prova de posse dos dois canais, perfil, população, revogação, privacidade e piloto ainda pendente. Não inferir identidade por nome/foto nem confundir prova técnica com aceite real de uma pessoa.

agente-proativo-rotinas.md registra A05: políticas, convenções de calendário, eventos explícitos, agendamento/filas, quotas, recuperação e limites do piloto. politica-de-base-e-privacidade-proposta.md é proposta A16, não política aprovada; enforcement/retencão dependem de revisão.


conversa-de-execucao-rotinas.md registra A06, proposta/confirmacão, autoria, acesso, contagens, provas e pendência de navegador/Slack real.


supervisao-e-escalonamento-rotinas.md registra A07, decisões humanas, política limitada de lembrete, fila interna, testes e pendências de revisão/implantação.


acesso-e-recuperacao-de-conta.md registra A14, recuperação durável, revogação, migração de sessões, isolamento de aquisição e checklist de liberação. Build local e migração não representam deploy nem recebimento de e-mail.


operacao-e-qualidade-do-agente.md documenta A17, fila de lacunas, histórico próprio, saúde/limites do snapshot, runbook e avaliação isolada.


resultado-com-evidencia.md registra base A10 implementada, decisões de rubrica/amostra/privacidade pendentes e desenvolvimento que permanece após revisão. Não apresenta baseline como estimativa ou homologação.


homologacao-integral-2026-10-20.md consolida matriz A01–A18, fronteiras de prova, testes preparados versus executados e checklist final. Não representa aceite de produção.


evidencias/ conserva relatórios fictícios e manifestos de avaliação; não contém credenciais/conversas reais. Bruto versus reprocessamento são provas distintas, explicitadas em operacao-e-qualidade-do-agente.md.
