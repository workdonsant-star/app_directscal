# Testes unitários

Vitest em ambiente Node, com alias `@/` configurado na raiz. Teste regras de domínio e contratos com dados fictícios, sem acessar serviços externos. Para mudanças localizadas, rode o arquivo específico. Os testes de categorias garantem agrupamento por categoria, normalização e conservação de todos os ativos.

`management-asset-download.test.ts` verifica o handler de Markdown com sessão e data-source substituídos: exige autenticação, bloqueia superadmin antes da leitura, recusa tipo/ativo indisponível e valida attachment sem cache com nome seguro para os quatro tipos. O corpo Markdown é gerado pelo helper real; seus casos de formatação têm testes separados.

`management-asset-markdown.test.ts` verifica metadados, títulos, marcas combinadas, links com parênteses, texto literal, listas aninhadas com início personalizado, destaques e tabelas com quebras, barras e ausência de cabeçalho.

Os testes de decisões de projeto verificam preparação sem mutação, confirmação e comunicações simuladas, conservação do prazo original e da pendência, suspensão distinta de conclusão, validação de prazo e rejeição de propostas desatualizadas. Não exercitam Slack ou ferramentas externas.

`management-assets-bulk.test.ts` verifica contratos, autorização, isolamento por empresa, bloqueio de arquivados, especialista válido, contagem real da mutação e abertura de v2 por cópia da v1 sem sobrescrever a publicação. Supabase é substituído; os testes não alteram dados reais nem comprovam persistência em produção.

- person-profiles.test.ts verifica autenticação, isolamento da conta pessoal, permissões de especialistas, remoção de foto, validação de imagens e falhas de gravação sem vazar detalhes do banco.

- `action-points-list.test.ts` e `action-point-execution.test.ts` verificam a junção da seleção publicada às atribuições, atraso, cadência padrão, os três agrupamentos e as regras de atualização (primeira atribuição, troca, remoção, etapa, prazo, nota e validações). `slack-format.test.ts` cobre também o filtro de membros do Slack e a checagem de escopos. Nada acessa serviços externos.

`client-onboarding.test.ts` cobre conexão/permissões Slack, estrutura mínima, falha de convite, aceite assíncrono, setores inativos e setores sem liderança ausentes do DTO.

`client-onboarding-api.test.ts` cobre sessão, papéis, intents temporários, progresso incompleto e falhas sem vazamento. `client-onboarding-data-source.test.ts` cobre isolamento pelo membership, revalidação do Slack, idempotência e falha de persistência. Testes usam substitutos e não gravam contas reais.

`auth-session-promotion.test.ts` executa o callback JWT real com provedores e banco substituídos: promove sessões de aquisição/convite quando membership existe, limpa os intents e mantém aquisição pendente sem membership. Regressão do loop de redirects do onboarding.
