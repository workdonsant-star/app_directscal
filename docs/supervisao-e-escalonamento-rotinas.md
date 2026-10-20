# A07 — Supervisão e escalonamento

Implementação local de 20/10/2026, com migrações aplicadas ao banco conectado. Revisão visual, implantação e piloto real permanecem pendentes. Todos os testes de mensagem usam substitutos ou fixtures fictícias; nenhuma política real está ativada.

## Fila e revisão

Na operação de rotinas de cada empresa, a fila identifica evidência/solicitação de exceção aguardando revisão, bloqueio relatado, silêncio, atraso de retorno e proposta expirada. Classificar não grava execução nem comprova falha. Um relato novo invalida a revisão do anterior. A fila é interna à DirectScal; não existe push automático para uma pessoa do Slack identificada como gestor.

Superadmin definitivo pode validar/devolver evidência, aprovar/recusar exceção, registrar orientação e acordar retorno. Motivo, ator, ciclo e tentativa são obrigatórios. O cliente lê as decisões sob a mesma autorização do ciclo. Pessoas de outro tenant, clientes e sessões temporárias não acessam a operação.

Validar exige execução relatada com evidência; somente a revisão do relato vigente conta. Exceção solicitada permanece no denominador até aprovação explícita. Orientar um bloqueio preserva a não execução e a etapa de implantação. O prazo de retorno não altera `due_at`, não reabre oportunidade nem apaga atraso/denominador histórico. Alterar a regra para oportunidades futuras continua no fluxo A04.

Decisão, fato de revisão quando aplicável, histórico da ação e recibo são uma transação. Conflito conserva o texto; falha no histórico reverte a decisão inteira. Histórico privado é append-only. A leitura pagina todos os ciclos, sem converter falha em base parcial.

## Política implementada para revisão do piloto

- Contato inicial somente na política A05 explicitamente ativada.
- Após 24 horas sem retorno, no máximo um lembrete por ciclo, na mesma DM, janela e cotas. A autorização informa esse comportamento antes de ativar.
- Conversa recente na DM adia o lembrete por 24 horas. Consulta não vira execução.
- Relato, proposta de confirmação ou intervenção humana cancela a cobrança pendente. Pausa, retirada da origem, troca de pessoa, versão/instalação inválida e ausência de público continuam impedindo o despacho.
- Após 48 horas, silêncio aparece como escalonado na fila da operação. Não gera novas cobranças automáticas ou mensagem a um gestor inferido.
- Oportunidades muito antigas, além de trinta dias do prazo, seguem para reconciliação humana. Não reconstruímos contato histórico nem repetimos lembrete cancelado/incerto após retomar uma rotina.

Esses intervalos são os padrões implementados para aceite, não uma política metodológica aprovada pela criação do código. Revê-los no checklist da tarefa. Há uma oportunidade por ciclo e unicidade independente para contato inicial/lembrete. O lote de até 25 lembretes conserva cursor por ciclo, inclusive depois de erro, para permitir avanço. A15 mantém resposta antes do envio, limites de tentativa e tratamento de envio incerto.

## Operação e recuperação

O consumidor interno de agenda continua exigindo segredo dedicado e só cria registros de fila. O consumidor Slack entrega separadamente. Nenhum cron foi criado; ambos precisam de acionamento e monitoramento na implantação. Antes do piloto, confirmar responsável pela fila e frequência de revisão. Não tratar a existência da fila como garantia de que alguém a acompanha.

Uma orientação gravada aparece no app. Ela não é apresentada como uma mensagem entregue no Slack. Se o piloto exigir aviso automático a um gestor específico, definir destinatário, escopo, canal e política antes de acrescentar esse envio.

## Verificação

Testes SQL fictícios com ROLLBACK validam aprovação/devolução, exceção, concorrência, rollback de revisão/fato/histórico, retorno sem mudar oportunidade, unicidade de lembrete, adiamento por conversa recente, thread e cancelamento após relato. Agenda A05 e conversa A06 foram reexecutadas após a mudança. Nenhuma fixture, política habilitada ou job ficou na base ao final.

Os testes locais de tipos, regras e API não substituem revisão visual ou um ciclo real do Slack. O checklist do CRM conserva essas fronteiras abertas.
