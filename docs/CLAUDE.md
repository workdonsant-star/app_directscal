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
