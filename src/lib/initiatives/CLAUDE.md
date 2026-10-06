# Iniciativas — armazenamento local

Contém o contrato Zod e o hook `useInitiatives`. Nesta entrega, não há API nem escrita no Supabase. O armazenamento usa `directscal:initiatives:v1:<userId>:<organizationId>`; a separação é por usuário e empresa, sem colaboração entre contas.

Os quatro nomes iniciais vêm do frame Figma 242:267. São registros de partida da interface, com objetivo, responsável e prazo vazios; não representam projetos reais já cadastrados no servidor. A primeira gravação preserva a lista completa no navegador. Dados inválidos ou armazenamento indisponível devem ter fallback seguro. As mutações só confirmam sucesso após gravação; eventos locais e `storage` sincronizam sidebar e tela, inclusive entre abas. Prazos usam YYYY-MM-DD.

## Prévia da execução

`project-preview.ts` contém tipos exclusivos da demonstração e a fábrica de cinco tarefas fictícias de `novo-website`. Cada chamada retorna uma lista nova; outros IDs recebem lista vazia. Não é um data-source de produção nem altera o contrato Zod do armazenamento. Tarefas permanecem em estado React, sem persistência ou compartilhamento. `originalDueAt` conserva o compromisso inicial; ajustes e decisões são registrados no histórico. Uma mudança manual de prazo remove a confirmação anterior, sem presumir aceite do executor.

Prazos e horários de demonstração usam `YYYY-MM-DDTHH:mm`, interpretados como horário local da interface; o formato visual omite o ano, mas o valor original é mantido em `time.dateTime`. A futura integração deverá definir fuso, identidade, permissões e fonte canônica conforme a especificação funcional; não reutilizar estes exemplos como registros reais.

`ProjectTask.assigneeAvatarUrl` é opcional e alimenta a foto na coluna Executor. Os exemplos usam retratos ilustrativos locais em `public/initiatives/avatars`; o mesmo executor mantém a mesma foto nas tarefas. Tarefas criadas pelo formulário não recebem foto automaticamente e usam iniciais. Não há resolução de identidade por nome nem integração com perfis reais nesta mudança.

## Prévia de decisões

`project-decisions.ts` prepara uma proposta tipada e aplica somente após confirmação. Valida orientação, prazo e versão dos campos relevantes. Não interpreta linguagem natural nem chama serviços. Eventos distinguem progresso, acompanhamento, impedimento, decisão, comentário no card e mensagem ao executor. Comunicações preparadas recebem `delivery: simulated`, sem significar envio bem-sucedido.

Suspensão é `paused`, separada de conclusão, e conserva a atenção anterior para retomada. Adiar retira a confirmação anterior e conserva o impedimento; call e orientação não resolvem pendência nem alteram prazo. `originalDueAt` nunca é sobrescrito. Exemplos históricos precedem as interações atuais; timestamps continuam locais. Testes em `tests/unit/project-decisions.test.ts` verificam essas invariantes e a rejeição de proposta desatualizada.
