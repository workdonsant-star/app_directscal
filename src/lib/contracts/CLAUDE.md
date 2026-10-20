# `src/lib/contracts` — Contratos de dados

Esta pasta define os contratos de dados preparados para a futura integração com Supabase.

## Convenções

- Use Zod para schemas runtime e `z.infer` para tipos TypeScript.
- `Db*` representa o formato futuro de banco/Supabase, com campos `snake_case`.
- DTOs e modelos de domínio usados pela UI ficam em `camelCase`.
- Datas de evento usam datetime ISO com offset (`createdAt`, `updatedAt`, `activatedAt`, `closedAt`).
- Datas de prazo usam date ISO (`deadline`, formato `YYYY-MM-DD`).
- IDs continuam como `string` nesta fase porque os mocks usam valores como `diag_01`; a futura migração para UUID deve ser feita nos schemas, não nos componentes.
- Componentes não devem importar schemas diretamente salvo necessidade de validação local. Prefira tipos e funções de `src/lib/data/`.
- Contratos do cronograma ficam em `gantt.ts`: status, tarefas recursivas, metadados opcionais de action point para detalhe de execução e payload de workspace usado para transformar action points em frentes no Gantt.
- Contratos do superadmin ficam em `admin.ts`: módulos, campanhas, campos configuráveis, leads, empresas e input de submissão pública.
- Contratos da operação especializada ficam em `admin-operations.ts`: especialistas, entregas, estados e catálogo de action points da primeira versão frontend.
- Especialistas e autores dos ativos aceitam `avatarUrl` opcional, como URL absoluta ou caminho local iniciado por uma única `/`. Ausência de foto mantém as iniciais na biblioteca.
- Contratos dos ativos de gestão ficam em `management-assets.ts` (biblioteca, leitura, fluxo editorial do admin, perguntas ao agente com histórico opcional, citações e auditoria) e `rich-text.ts` (documento restrito do editor). O formato legado em blocos por seção continua aceito como `legacySop*` para modelos e versões antigas.
- Contratos de setores, lideranças e convites ficam em `organization-structure.ts`. `accessLevel` usa `owner | admin` na UI e mapeia para `cliente | admin` no banco; o `superadmin` global nunca é uma opção. Essa opção de acesso pertence aos convites legados. Novas lideranças usam `createSlackSectorLeaderInputSchema`: setor e Slack user ID, cargo opcional, sem e-mail nem nível de acesso. DTO permite cargo/e-mail vazios e carrega referência Slack opcional; nome/foto/cargo são hidratados do workspace, sem persistir diretório.
- `Diagnostic` carrega criador, setores e permissões derivadas. `DiagnosticShareLink` possui identidade própria e setor opcional; a coleção de links é variável porque existe um link de Time por setor.

## Mappers

`mappers.ts` centraliza a conversão de `Db*` para domínio/UI. Não duplique conversões dentro de páginas ou componentes.

As ações em massa usam schemas estritos em `management-assets.ts`: empresa UUID, 1–200 IDs UUID únicos e apenas os metadados explicitamente solicitados. Autor e categoria aceitam null para limpar o vínculo/valor; conteúdo e status não são editáveis por esse contrato.

- personalProfileInputSchema é estrito e não aceita userId. Nome tem 1–160 caracteres; avatar aceita null para remoção, raster base64 limitado a 1 milhão de caracteres, HTTPS ou caminho local. Blob e SVG são recusados.

- Contratos da execução dos action points ficam em `action-point-execution.ts`: etapas (`atribuido`, `em_implementacao`, `bloqueado`, `concluido`; a ausência de atribuição é "Sem responsável" na interface), cadências, responsável do Slack, atribuição, evento de histórico e o input do `PATCH` (`assigneeUserId: null` remove o responsável).

- `last_edited_by_user_id` registra o ator autenticado ao criar/salvar rascunho de ativo. A leitura mostra `lastEditedBy` da versão publicada, resolvido pelo perfil da conta, em Editado por na barra de metadados. Histórico sem registro fica Não registrado; criador, especialista e publicador não são usados para inferir a última edição.

- `organization_asset_navigation` persiste ordem e ícones por empresa com RLS e grants somente service_role. `asset-navigation` define payload estrito e catálogo fechado; layout lê pela empresa da sessão, PUT /api/settings/asset-navigation exige dono cliente e ignora qualquer tentativa de escolher organização no payload. Sem localStorage nem modificação de documentos/categorias.

- Seletor de ícone usa catálogo completo da versão instalada lucide-react (1.14.0, 1952 entradas), em grade sem nomes visíveis; aria-label preserva identificação. Busca por nome Lucide e carregamento incremental de 120 itens. JSONs lucide-icon-catalog/names são gerados das exportações __iconNode de dist/esm/dynamicIconImports.mjs (licença ISC do Lucide); regenerar ao atualizar a dependência. Contrato valida nomes canônicos e preserva aliases dos 15 ícones legados.


- management-asset-update.ts define payload estrito do cliente: expectedVersionId UUID, título de 1–200 caracteres, resumo de 1–2000 e RichTextDocument validado. Empresa, ator e permissões nunca vêm do payload.

- customerAssetBulkUpdateSchema aceita 1–1.000 UUIDs únicos e changes estrito com type e/ou categoryKey. Categoria é chave da pasta já listada, resolvida no servidor; empresa e ator não são aceitos.

- assetNavigationPreferencesSchema inclui categories opcional para compatibilidade, com chave estável e título de até 80 caracteres. assetNavigationWriteSchema aceita somente order/icons, impedindo sobrescrever registro de categorias via PUT. assetCategoryInputSchema valida title e key opcional; POST cria, PATCH exige chave.

- deleteAssetCategoryInputSchema recebe key e no máximo um de destinationKey/newTitle. Ausência de destino é permitida no contrato só para categoria vazia; banco reconta e exige destino se houver documentos. Registro categories aceita deleted opcional para suprimir os quatro padrões excluídos (até 100 categorias ativas + quatro supressões).

- Prazo de resposta é obrigatório ao criar/configurar pesquisas. Contratos de escrita recusam ausência/null e a ativação revalida o prazo persistido, inclusive para rascunhos antigos. Leituras preservam compatibilidade com pesquisas antigas sem prazo.


O catálogo administrativo de ações exige dimensionId (enum das seis dimensões); dimension permanece somente como rótulo. A conciliação com relatórios nunca compara nomes visíveis.


DiagnosticActionPoint aceita título opcional da ação publicada, preservado no PDF junto à descrição; planos históricos sem título continuam compatíveis.


A13: submissão anônima exige `submissionId` UUID aleatório por tentativa/link e exatamente o conjunto de perguntas. O identificador não representa a pessoa e não aceita nome, e-mail, conta, IP ou fingerprint no payload.


A11: companySpecialistInputSchema é estrito, aceita somente specialistId e expectedUpdatedAt (ambos anuláveis). Empresa/ator vêm de rota/sessão. companyOperationsSchema descreve atribuição versionada e histórico real por diagnóstico, com indicação de base para análise.

A12: os quatro tipos (SOP, Playbook, Governança e RACI) são editáveis. `updateManagementAssetInputSchema` exige `expectedRevision` com timestamps brutos do ativo/rascunho e ID do rascunho, sem normalização que perca precisão. A lista administrativa inclui responsável, periodicidade e revisão de validade com data ISO ou ausência explícita de prazo.

A03: `asset-adherence.ts` define acordos imutáveis versionados, regra periódica/por evento, oportunidades explícitas e fatos separados de leitura, relato, revisão de evidência, exceção e resultado. Revisões referenciam o relato/solicitação específico; nenhum desses tipos representa nota estimada de impacto.

A04: admin-adherence.ts define união estrita salvar/transferir/situacao, revisões esperadas, tentativas UUID, motivo, expectativa e indicador de sucesso. Organização, ator, workspace, nome e foto nunca são aceitos do navegador. A leitura do cliente recebe somente os acordos da seleção publicada, sem write_payload ou credenciais.

A15: slack-delivery.ts valida pergunta limitada (workspace/pessoa/canal/timestamps/kind), resposta e reserva. Payload não contém token ou organização escolhida pelo chamador; organização é derivada da instalação ativa no banco.

A09: slack-identity define status próprio (conexão disponível, vínculo confirmado, workspace e horário). Não concede acesso ao painel nem carrega tokens ou código de outro usuário.

A05: routine-contacts define política estrita com versão/tentativa, setores, dias, janela/fuso e limites, além de ocorrência com origem HTTPS, identificador estável e horários locais. Ativação exige público. Ordem de setores/dias é normalizada sem alterar o escopo. SlackDeliveryJob distingue pergunta recebida de contato de rotina; resposta de rotina pode carregar somente o DM resolvido pelo servidor.


A06: routine-replies tipa operações, contexto, proposta e registros autorizados. Fato manual exige conta; fato Slack exige origem e evento/workspace/pessoa com ator do app nulo. Leitura, relato, bloqueio, solicitação de exceção e progresso permanecem distintos.


A07: routine-supervision define decisão estrita (evidência, exceção, orientação ou prazo de retorno), revisão esperada, motivo e tentativa UUID. Contrato de registro do cliente inclui decisões humanas. Contato distingue inicial/lembrete; o lembrete não cria outra oportunidade.


A14: password-recovery.ts define payloads estritos sem ator/empresa, senha de 12–128 caracteres, confirmação e senha atual para troca autenticada. Recuperação recebe somente e-mail; conclusão exige token e nova senha. Não registra plaintext em auditoria.


A17: agent-operations valida evento idempotente, revisão esperada, status, responsável global, justificativa, evidência HTTPS e prazo. Resolver exige responsável/evidência. assistant-history descreve página própria e cursor estrito, sem campos de identidade/empresa editáveis.


A10: routine-results exige três camadas únicas, contagem e score coerentes (zero respostas implica score nulo). Não há valor padrão, confiança ou estimativa gerada por estes contratos. Captura aceita somente ruleId.
