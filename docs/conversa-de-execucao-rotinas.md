# A06 — Conversa de execução

Implementação local de 20/10/2026, com migrações aplicadas ao banco conectado. Implantação dos handlers, revisão visual e aceite real no Slack continuam pendentes. Nenhuma mensagem externa foi enviada pela validação.

## Relato e confirmação

Consulta segue para o agente de busca. Relato explícito de execução, não execução, leitura, bloqueio, exceção ou progresso gera uma proposta de trinta minutos. A proposta identifica ativo/versão, rotina, ciclo, período, conteúdo e evidências. Botões ou comandos `confirmar <proposta>` e `cancelar <proposta>` passam pela fila durável A15. O modelo não autoriza escrita nem escolhe empresa, destinatário ou ciclo.

Um sim isolado e referências múltiplas exigem esclarecimento. Sem referência/thread e com vários ciclos elegíveis, o sistema não escolhe o mais recente. O parser é conservador: redações não reconhecidas não alteram dados. Perguntas continuam consultas. A integração atual não usa eve nem acrescenta dependência.

O banco exige ingresso reservado, lease vigente, instalação ativa, mesma pessoa/workspace/DM e contato inicial com confirmação de entrega. Revalida seleção publicada e atribuição. Ciclos antigos aceitam relato se o responsável continua o mesmo; pausa interrompe contatos novos, preservando o recebimento sobre ciclos existentes. Transferência exige revisão dos relatos do responsável anterior.

## Escrita atômica e autoria

Proposta não grava execução. Confirmação une fato, histórico da ação, progresso quando aplicável e recibo. Reentrada não duplica registros. Um relato posterior ou alteração de implantação invalida a proposta concorrente correspondente. Falha de histórico reverte toda a confirmação. Depois do commit, uma falha no aviso não apaga o fato: A15 conserva a resposta e separa envio incerto de falha confirmada.

Fatos do Slack têm origem explícita e referência ao evento/pessoa/workspace; ator do app permanece nulo. Não criamos conta nem atribuímos autoria ao dono em nome de uma pessoa que só atua no Slack. Registros manuais continuam exigindo conta autenticada da operação/dono.

- Execução relatada nunca é validação automática de evidência.
- Bloqueio cria relato de não execução com motivo preservado na proposta; não muda a etapa de implantação.
- Exceção gera solicitação; permanece no denominador até revisão humana em A07.
- Progresso atualiza somente o valor de implantação, sem concluir etapa ou comprovar aderência.
- Leitura permanece distinta de execução.

## Leitura no app

Action Points mantém a lista e o painel existentes. Mensagens reais do ingresso e respostas com timestamp de entrega alimentam a timeline; consultas soltas e respostas apenas preparadas ficam fora. Autores não usam fotos demonstrativas. O acordo oferece o relato completo, links HTTPS, situação da confirmação, período e fatos de revisão.

A leitura aplica primeiro RLS do diagnóstico e depois RPC privada com membership. Dono vê os ciclos autorizados da coleta; admin precisa de vínculo app/Slack confirmado e recebe somente ciclos atribuídos àquela identidade. Identidade não concede acesso ao diagnóstico. A política mais ampla de audiência permanece na A16.

Leitura pagina todos os ciclos em lotes de cem com cursor bruto; falha não vira base parcial. O resumo soma numeradores/denominadores de oportunidades explícitas vencidas nos últimos trinta dias, incluindo eventos atestados. Não calcula média de percentuais, não inclui períodos ainda abertos e não exclui exceções pendentes. O detalhe do acordo preserva todo o histórico disponível, com seu próprio total histórico claramente identificado. Sem oportunidades, não há percentual. Estados sem resposta ficam distintos de não execução relatada. A meta ilustrativa de 80% não é aplicada à operação.

## Evidências e pendências

`supabase/tests/routine-execution-replies.sql` usa somente fixtures fictícias e ROLLBACK. Testa proposta sem escrita, confirmação, reentrada, pessoa incorreta, referência/ciclo, lease forjado, concorrência, falha injetada no histórico, leitura, exceção, progresso sem conclusão, expiração/cancelamento, publicação retirada, instalação revogada, acesso de outra empresa e leitura por identidade vinculada. Não testa transporte real.

Testes unitários cobrem parser, URLs do Slack, entrada assinada, persistência antes do aceite, 503, seleção ambígua, identidade revalidada, proposta sem confirmação e paginação completa. SQL aplicado não equivale a deploy do app.

Revisão visual foi tentada na sessão normal do cliente com fixture descartável, mas a conexão do navegador falhou antes da abertura da página. A fixture foi removida e a ausência dos registros confirmada. Não existe prova visual nova da A06 nem aceite de pessoa real no Slack. O checklist de revisão permanece na tarefa do CRM.
