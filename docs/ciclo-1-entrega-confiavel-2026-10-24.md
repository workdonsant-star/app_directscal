# Ciclo 1 — entrega confiável — 24/10/2026

## Estado da entrega

As seis tarefas foram trabalhadas na sequência A14 → A16 → M04 → M03 → A08 → A01. A etapa disponível de cada uma foi registrada como **Bloqueada**, conforme solicitado, para revisão de Don. A16 exige decisão de produto antes de implementar a proteção. O fechamento integral do ciclo não está homologado: implantação, piloto real de acesso, proteção de base pequena e aceite ainda pendentes. Não avançar para o ciclo 2.

Repositório: `app_directscal`, branch `main`, base `7a4854a`, alterações locais sem commit. O checkout já continha mudanças de demo e componentes compartilhados, preservadas nesta entrega. Esta evidência distingue app operacional, fixture, banco e produção; a demo não é prova do app operacional.

Revisão visual: [abrir capturas e PDFs](evidencias/ciclo-1-2026-10-24/index.html). Notion: [V01 — validação do ciclo 1](https://app.notion.com/p/403026c1ddec811a912cfe9422cfca67).

## Alterações e decisão de revisão

| Tarefa | Parte técnica produzida/verificada | Revisão ou pendência |
| --- | --- | --- |
| A14 | Correção da leitura única do token de recuperação; erro em link vazio/malformado; preservação dos campos; testes de expiração, falha, sessão antiga e isolamento. | Don revisa clareza e indica conta autorizada. Implantação, provedor/worker, e-mail real, OAuth/convites e RLS versionado continuam técnicos. |
| A16 | Proposta com grupos de 1/4/5, subtração, fundador e coleta ativa; aviso sem promessa de anonimato absoluto; retenção separada. | Don decide parâmetros. Enforcement no servidor, leituras, PDF/CSV/agente ainda precisa ser implementado após a decisão. |
| M04 | Percepção e acompanhamento; coleta mais recente por padrão; período, base e versão original; comparação por empresa/instrumento/perguntas; consultas e execução separadas. | Revisar linguagem/hierarquia. Integração de A16 pendente. Novo instrumento de M01 não foi iniciado. |
| M03 | Apoios preservados; texto inicial editável; indicador de alterações; prévia com seis seções e descrição das ações; republicação após editar. | Don revisa o apoio à redação e o texto final. Não foi adicionada aprovação redundante. |
| A08 | Falha de salvamento preserva redação; snapshot SQL publicado permanece durante rascunho; seis seções na tela/PDF; cabeçalho PDF com área reservada, inclusive continuação. | Revisão editorial/visual. Homologação autenticada e integração A16 pendentes. |
| A01 | Descrição da ação publicada no detalhe; leitura contextual separada; retorno ao relatório da mesma coleta; etapa/prazo/implantação separados de execução; acesso no relatório compacto. | Don compara descrição/PDF e clareza de estados. Sem atribuição ou envio Slack real nesta rodada. |

## Validação executada

- `npm run test`: **90 arquivos, 520 testes aprovados**. Inclui testes preexistentes do checkout. Após ajuste final do PDF/DTO, regressões de publicação passaram novamente.
- `npm run lint`: aprovado.
- `npx tsc --noEmit`: aprovado após remoção da rota temporária e regeneração/limpeza dos tipos gerados. Uma execução intermediária apontou referência do Next à rota já removida; não era erro do código de produção.
- `npm run build`: aprovado, sem rota de fixture. Nenhum deploy executado.
- Playwright: **19 cenários distintos aprovados em rodadas** (7 recuperação; 12 C1 nos dois temas). O conjunto inicial de 17 passou; os dois de entrega nova e os casos modificados foram reexecutados. APIs interceptadas; componentes reais; navegação de etapas por controles de fixture. Não equivale a E2E autenticado integral.
- Navegador em claro/escuro, desktop 1440px; recuperação e aviso da pesquisa também em 375px. Capturas de Sheet aguardam o fim da transição; entrada nova aguarda hidratação do React. Falhas intermediárias de seletor/tempo de hidratação foram ajustadas nos testes, com reexecução aprovada.
- SQL existente no projeto Supabase: `customer-password-recovery.sql` → `customer_password_recovery_ok`; `isolated-atomic-acquisition.sql` → `isolated_atomic_acquisition_ok`; `delivery-revisions.sql` → `delivery revisions: ok`. Fixtures fictícias e `ROLLBACK`; nenhum dado operacional mantido. `session_security_enforcement.enabled` segue `false` até implantação compatível.
- PDF: relatório curto com 10 páginas, longo com 12 e Action Points com 4. Extração das seis seções e da descrição publicada; uma ação apesar de seleção duplicada. Renderização e inspeção visual, com correção da sobreposição do cabeçalho editorial. Poppler encontrou configuração de fontes indisponível; conferência final usou PDFium com bitmap preservado.

Logs e capturas em `docs/evidencias/ciclo-1-2026-10-24/`. A geração dos PDFs usou os componentes reais com fixture do Analytics e texto inicial fictício, sem publicar entrega. Os testes temporários de geração e a rota `/c1-review-fixture` foram removidos. Reprodução de UI em `tests/e2e/fixtures/CLAUDE.md`.

## Roteiro de revisão disponível agora

1. Abrir o índice visual e conferir recuperação e aviso da pesquisa.
2. No Analytics, conferir o que a nota mede, a base e a separação de consulta/execução.
3. Conferir prévia com seis seções e a leitura nativa. O resumo editado no teste do editor é identificado; o PDF usa o fixture editorial original, não é recibo da chamada interceptada.
4. Abrir PDF e Action Point: comparar título/descrição; conferir prazo sugerido versus acordado e ausência de medição.
5. Registrar aprovação visual/editorial ou ajuste na tarefa correspondente. Decidir A16 separadamente.

## Preparação para homologação integral — responsabilidade técnica

Não há novo link de aplicação publicado ou conta de homologação entregue nesta rodada. O índice é material de revisão visual, sem login. Depois da decisão A16 e da escolha de conta piloto:

1. Implementar e testar proteção integrada de base/públicos/subtração.
2. Preparar implantação compatível sem incluir a rota temporária; configurar URL canônica, remetente verificado, provedor e consumidor de recuperação sem expor segredos.
3. Usar conta autorizada para recebimento real, senha digitada pelo titular, reentrada, Google/convite e revogação. Ativar enforcement de versão somente com deploy compatível.
4. Demonstrar com empresa fictícia e sessão autorizada: coleta → rascunho → leitura antiga → publicação → nova leitura/PDF → ação da mesma coleta.
5. Registrar aceite V01 antes de concluir o ciclo e iniciar o próximo.

A aprovação desta revisão visual não significa consentimento para retenção/expurgo ou ativação de contatos. Não foram executados exclusão, envio de mensagem/e-mail, mudança de senha real, publicação real ou deploy.
