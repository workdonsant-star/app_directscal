# Testes unitários

`demo.test.ts` valida ligação entre ativos/rotinas e os quatro tipos, fonte/recusa do agente, reentrada do estado local, proteção das coletas encerradas, revisão única e roteamento isolado entre as visões de cliente e superadmin. Não chama serviços externos.

`reports-empty-state.test.ts` verifica que uma conta sem diagnósticos publicados e sem PDFs enviados vê o estado vazio, sem relatório Acme inserido automaticamente. `profile-settings-data.test.ts` também recusa montar o perfil de uma conta definitiva sem organização persistida.

`agent-openai-provider.test.ts` valida a chamada estruturada ao endpoint Responses da OpenAI com fonte fictícia, segredo somente no header e `store: false`; o transporte é substituído e não usa uma chave real.

`admin-action-points-view.test.ts` verifica agrupamento das ações publicadas por responsável e uso da revisão vigente da rotina sem confundir Action Points de diagnósticos diferentes.

`action-point-follow-up-classification.test.ts` cobre silêncio após prazo e entrega, falha de transporte, resposta vaga/contraditória, cumprimento parcial, falta de evidência e atendimento. A regra ainda não recebe respostas reais do Slack.

Vitest em ambiente Node, com alias `@/` configurado na raiz. Teste regras de domínio e contratos com dados fictícios, sem acessar serviços externos. Para mudanças localizadas, rode o arquivo específico. Os testes de categorias garantem agrupamento por categoria, normalização e conservação de todos os ativos.

`diagnostic-leader-selection.test.ts` cobre associação automática de lideranças ativas, exclusão de pendentes/inativas e empresa sem lideranças. A demo cobre criação de pesquisa sem seleção e link geral fictício de Time.

`diagnostic-response-csv.test.ts` verifica autorização antes da leitura e serialização de notas individuais com UTF-8, acentos e proteção contra fórmulas de planilha. Não consulta respostas reais.

C1: collection-comparison verifica seleção da coleta por data original, IDs de pergunta independentes, mudança de texto/conjunto/empresa e exclusão de referências incompatíveis sem mutar o histórico.

`management-asset-download.test.ts` verifica o handler de Markdown com sessão e data-source substituídos: exige autenticação, bloqueia superadmin antes da leitura, recusa tipo/ativo indisponível e valida attachment sem cache com nome seguro para os quatro tipos. O corpo Markdown é gerado pelo helper real; seus casos de formatação têm testes separados.

`customer-document-download.test.ts` verifica que arquivos privados enviados pela operação exigem sessão e membership da mesma empresa antes de baixar; confirma attachment sem cache, sem expor o caminho do bucket.

`management-asset-markdown.test.ts` verifica metadados, títulos, marcas combinadas, links com parênteses, texto literal, listas aninhadas com início personalizado, destaques e tabelas com quebras, barras e ausência de cabeçalho.

Os testes de decisões de projeto verificam preparação sem mutação, confirmação e comunicações simuladas, conservação do prazo original e da pendência, suspensão distinta de conclusão, validação de prazo e rejeição de propostas desatualizadas. Não exercitam Slack ou ferramentas externas.

`management-assets-bulk.test.ts` verifica contratos, autorização, isolamento por empresa, bloqueio de arquivados, especialista válido, contagem real da mutação e abertura de v2 por cópia da v1 sem sobrescrever a publicação. Supabase é substituído; os testes não alteram dados reais nem comprovam persistência em produção.

- person-profiles.test.ts verifica autenticação, isolamento da conta pessoal, permissões de especialistas, remoção de foto, validação de imagens e falhas de gravação sem vazar detalhes do banco.

- `action-points-list.test.ts` e `action-point-execution.test.ts` verificam a junção da seleção publicada às atribuições, atraso, cadência padrão, os três agrupamentos e as regras de atualização (primeira atribuição, troca, remoção, etapa, prazo, nota e validações). `slack-format.test.ts` cobre também o filtro de membros do Slack e a checagem de escopos. Nada acessa serviços externos.

`client-onboarding.test.ts` cobre conexão/permissões Slack, estrutura mínima, falha de convite, aceite assíncrono, setores inativos e setores sem liderança ausentes do DTO.

`client-onboarding-api.test.ts` cobre sessão, papéis, intents temporários, progresso incompleto e falhas sem vazamento. `client-onboarding-data-source.test.ts` cobre isolamento pelo membership, revalidação do Slack, idempotência e falha de persistência. Testes usam substitutos e não gravam contas reais.

`auth-session-promotion.test.ts` executa o callback JWT real com provedores e banco substituídos: promove sessões de aquisição/convite quando membership existe, limpa os intents e mantém aquisição pendente sem membership. Regressão do loop de redirects do onboarding.

`superadmin-password-login.test.ts` cobre também clientes/admins com hash real de teste, sem campanha, senha inválida, conta sem credencial/membership e rejeição de superadmin no caminho de cliente. O callback JWT de Credentials é exercitado em `auth-session-promotion.test.ts` para os três papéis. Nenhuma conta real é alterada.

`slack-leadership.test.ts` verifica cargo opcional, rejeição de campos de acesso/empresa, leitura transitória, revalidação da pessoa, gravação apenas de referências/overrides, troca de workspace, desconexão e falhas sem vazamento. Onboarding inclui referência Slack sem e-mail/cargo/convite; SQL transacional complementar em `supabase/tests/` cobre isolamento, atomicidade e seleção mista de pesquisas, sem efeitos após ROLLBACK.

A regressão de entrada do onboarding cobre dispensa por Slack da própria empresa, ausência de conexão, conclusão durável e ausência de escrita ao consultar.

`analytics-example.test.ts` valida relatórios fictícios completos, seis dimensões, métricas, filtro com comparação histórica e coerência dos totais de uso com semanas irregulares. Não acessa serviços externos.

- O salvamento de rascunho de ativos verifica também `last_edited_by_user_id` vindo do ator autenticado, mantendo o filtro que impede sobrescrever versão publicada.

- asset-navigation.test.ts cobre autenticação, papéis, intenções temporárias, isolamento da organização no servidor, falhas sem detalhes sensíveis, catálogo de ícones e ordem sem duplicatas.


customer-management-asset-update.test.ts cobre sessão, papéis, intents temporários, payload estrito, ator da sessão, conflito e falhas sem vazamento.

customer-management-asset-bulk.test.ts cobre autorização, intents temporários, payload estrito, IDs únicos, tipo/categoria separados ou juntos e conflitos sem vazamento. Teste SQL transacional complementar verifica atomicidade, autorização e preservação do conteúdo com ROLLBACK.

- asset-categories-api.test.ts verifica dono, intents, payload estrito, contexto de empresa/ator do servidor, nomes, renomeação conhecida e falhas sem vazamento. management-asset-categories.test.ts cobre pastas vazias e chaves/URLs estáveis com título renomeado.

- asset-categories-api.test.ts cobre também GET/DELETE, sessão definitiva, empresa/ator do servidor, payload de destino, consulta sem cache, destino próprio/desconhecido, criação de destino e mensagens de conflito. Helper de pastas testa supressão de padrões excluídos e recriação com nova chave.

- omdx-production-rules.test.ts cobre prazo inclusivo em São Paulo, instante de virada, virada de mês/ano e pesquisas sem prazo.

- omdx-response-deadline.test.ts verifica recusa 410 antes de qualquer escrita, link sem expiração, fim do dia e envio permitido dentro do prazo ou sem prazo, com Supabase substituído.

- omdx-production-rules.test.ts cobre status efetivo por prazo vencido, fechamento manual, prazo inclusivo/ausente e preservação de rascunhos.

- Contrato de criação de pesquisa recusa prazo ausente, nulo e vazio.

`omdx-analytics-overview.test.ts` verifica o veredito com a nota real e a adoção, a ordenação das dimensões e das perguntas, as três alavancas tratadas com sinal insuficiente na terceira, o determinismo e a ausência de veredito sem dimensões.


Regressões A01/A08: nomes completos conciliados por ID, seleção deduplicada no painel/PDF, recusa de rascunho com timestamp e publicação de outra coleta/empresa, base uniforme sem causa inferida, seis seções editoriais no PDF e ausência de aderência/conversa fabricada.


A13: `response-submission.test.ts` cobre chave estável por link, separação entre links e armazenamento inválido/indisponível. `omdx-response-deadline.test.ts` cobre RPC, falha sem cookie/sem vazamento, encerramento concorrente e reconhecimento idempotente. SQL complementar verifica rollback real.

A09: `process-usage-population.test.ts` cobre liderança Slack única entre setores, e-mail interno normalizado, conciliação somente por prova, workspace distinto e paginação integral. `process-usage-data-source.test.ts` verifica filtros de empresa/status, população Slack, identidades sem vínculo ou ausentes e supressão da adoção sem afetar cobertura.


A11: company-specialist-assignment.test.ts cobre sessão/papel, payload estrito, empresa/ator confiáveis, remoção, conflitos e falhas sem vazamento. published-specialist-contact.test.ts cobre seleção do contato publicado, campos mínimos e ausência de identidade/telefone/experiência fixos. Complemento SQL verifica persistência real e isolamento.

A12: `management-asset-raci.test.ts` cobre criação/modelo RACI e recusa de tipo incompatível. A publicação direta do rascunho substituiu a etapa de revisão dos ativos.

A03: asset-adherence.test.ts separa leitura/relato/validação/resultado, exceção aprovada/recusada, duplicação, limites de período, fatos futuros e agregados. asset-adherence-data-source.test.ts verifica escopo/ator, leitura de 1.001 ciclos sem truncar base, inconsistências e falhas sem detalhes sensíveis. Não realiza chamadas externas.

A04: a fonte de aderência também verifica ator explícito, versão esperada, justificativa normalizada, recusa 403 e rejeição de campos extras na pausa/retomada.

A04: admin-routines-api/data-source verificam sessão definitiva, papel, empresa/ator do servidor, payload estrito, diretório revalidado, origem publicada, versão e erro seguro. customer-routine-agreements verifica negação antes da consulta, RLS antes de service role e falhas sem detalhes privados. Não enviam mensagens ou acessam Slack real.

A15: slack-events-api verifica assinatura, persistência antes do aceite, 503, desafio e payload inválido; slack-delivery verifica fencing, geração/armazenamento/envio/confirmacão, resposta reutilizada e falhas sem retry cego; slack-delivery-transport verifica ts/canal, 429, token/escopo, timeout e 500; slack-delivery-operations-api verifica sessão definitiva, campos forjados, erro seguro e segredo obrigatório em tempo constante. Fetch/transportes são substituídos; sem mensagens reais.

A09: slack-identity/api verificam sessão definitiva, membership, código forte com hash exclusivo no banco, próprio status/desvinculação, campos forjados, limite e erros sem vazamento. A fonte de uso verifica conciliação comprovada e deduplicação de quem perguntou nos dois canais. Worker verifica que o código da DM não passa pelo agente de consulta. Não confirmam pessoa real nem enviam mensagens.

A05: routine-calendar verifica datas locais, abertura, fim de semana, acordo, evento não presumido, semana/quinzena, calendário e bissexto. APIs verificam superadmin definitivo, ator/empresa derivados, público/horário/cota e prova forjada, segredo fechado por padrão. Data-source verifica concorrência e cursor após erro. Worker/transportes verificam adiamento, revalidação após preparo, pessoa ativa na recuperação e abertura exclusiva de DM. São substitutos; não enviam mensagens.


A06: routine-reply-parser/replies/interactions-api cobrem consulta sem escrita, relato natural explícito, URLs do Slack, referências ambíguas, pessoa revalidada, proposta sem confirmar, assinatura e persistência antes do aceite/503. customer-routine-records verifica RLS antes da leitura privada, paginação integral e falha sem base parcial. Resumo testa soma 1/1 + 1/9 = 2/10, sem média de percentuais. Transportes substituídos; nenhum envio real.


A07: routine-supervision/api verificam tempos de silêncio/escalonamento, relato versus confirmação, revisão do fato vigente, bloqueio referenciado, prazo sem alterar oportunidade, sessão/papel, campos forjados, conflito e erro seguro. API interna agenda lembretes somente após autenticar. Sem transporte real.


A14: password-recovery, password-recovery-email e password-recovery-api verificam criptografia, idempotência/reserva, erros seguros, campos estritos, sessão e segredo interno com substitutos. auth-session-promotion cobre remoção de acesso/versão. Não enviam e-mails nem alteram contas reais.


A17: agent-operations verifica autenticação/tenant derivado, resolução com evidência, payload forjado, paginação e conflito. assistant-history verifica conta/canal/empresa e cursor sem perda de precisão; asset-agent-grader rejeita fonte correta com prazo errado e recusa por falha técnica.


A10: routine-results verifica camadas únicas, ausência sem score, sessão/global/intents, payload sem score/ator forjado e derivação de empresa/ator. Não avalia estimativa não implementada.


A17: asset-question-context verifica pedido de contexto sem busca/modelo para pergunta genérica e preservação de pergunta específica/continuação. Não afrouxa fontes ou transforma falha técnica em recusa correta.


A12: management-assets-bulk verifica conflito de exclusão por vínculo histórico, orientação de arquivar e ausência de detalhe privado no erro.


A17: asset-question-audits confirma lacuna na posição 501, empresa e cursor com microssegundos preservados; regressão do teto de histórico/paginação.


A17: asset-answer-policy cobre resposta que admite não especificar quem é responsável (recusa sem citações), preservação de papel explícito e negação correta de regra; grader aceita exclusão de jornada e continua rejeitando afirmação positiva contraditória.

A suíte demo também cobre URLs escopadas, recusa de destinos externos/IDs desconhecidos, conjunto integral e idempotência das respostas, transferência atômica de documentos entre categorias e contratos de agente/histórico.

`diagnostic-report-download.test.ts` cobre sessão, papel, publicação da própria coleta/empresa, relatório editorial padrão, preservação do PDF de dados/CSV e as seis seções publicadas. `diagnostic-report-pdf.test.ts` renderiza com fontes reais, texto longo e camadas sem base; `PDF_REVIEW_DIR` opcional salva PDFs fictícios para inspeção visual. Não acessam banco nem serviços externos.


`site-profile.test.ts` verifica CORS por origem exata, minimização da resposta, ausência de cache/cookies novos, sessão expirada/temporária, os três papéis e falhas seguras. Sessão substituída, sem serviços externos.

`company-deletion.test.ts` cobre autorização/intents, feature, origem, limite/duplicatas/IDs, confirmação literal, ator da sessão, RPC única, conflitos sem vazamento e resposta inválida. Usa substitutos, sem dados reais.


`superadmin-provisioning.test.ts` confere que o login conserva o membership global existente sem recriar a organização original por domínio após exclusão.

`admin-campaigns-loading.test.ts` verifica HTML inicial com campanha persistida, ausência de seeds durante a renderização, vazio real, feature flag, autorização antes da leitura privilegiada e falha sem fallback fictício. Não escreve no banco.

O mesmo teste cobre Empresas: HTML inicial com apenas organizações persistidas, ausência das empresas seed e de leads sem conta, vazio sem seleção, entrada mesmo com a aquisição desativada e autorização antes da leitura.

`admin-acquisition-snapshot.test.ts` verifica leituras independentes sem bloqueio por campanhas lentas, recusa de snapshot parcial em erro, seleção de organizações com membership cliente e compatibilidade com a tabela opcional de acessos ausente.

`process-usage-data-source.test.ts` também cobre a leitura administrativa do espelho de Analytics: somente superadmin recebe dados, e todas as tabelas usam a organização solicitada; cliente não acessa esse caminho.

A regressão de carregamento também cobre Leads (lista e detalhe), Módulos e ausência de organizações seed quando a fonte é omitida. `shared-loading.test.ts` verifica diretório de especialistas no HTML inicial e iniciativas sem exemplos antes de hidratar. `settings-loading.test.ts` garante que Empresa não espera consultas de setores/Slack e que cada seção busca somente seus dados. Os testes usam substitutos, sem acesso externo.

A suíte demo verifica também edição/publicação administrativa preservando versão anterior, conflito de revisão, criação dos quatro tipos, metadados em massa, recusa de empresa/ativo externo, proteção de vínculos históricos, pausa/retomada e captura de baseline após reentrada. Roteamento e downloads de entregas permanecem na demo.

A suíte demo cobre reentrada de action points pontuais antigos e novos sem prazo, recorrentes com e sem encerramento, preservando as demais alterações do cenário.

`access-snapshot.test.ts` verifica RPC única, perfil persistido sobre o Google, fallback quando a função não existe (sem reinsistir), propagação de outros erros e IDs fora do formato UUID. `auth-session-promotion.test.ts` cobre também a revalidação JWT pelo snapshot: sem consultas avulsas, versão divergente, acesso removido e precedência do superadmin.

`omdx-diagnostic-visibility.test.ts` executa `getDiagnostics` e `getVisibleDiagnosticIds` com Supabase em memória: cliente vê todos, admin vê os próprios e os atribuídos por setor (painel e Slack), admin sem vínculo não vê nada, e o nome do criador segue o perfil persistido antes da conta Google.
