# Inventário de fluxos, tarefas e sistemas — Nativa Forma

**Documento simulado para validação.** Recorte de setembro e outubro de 2026.

## Fluxos centrais

| Fluxo | Entrada → saída | Sistemas | Formalização observada no cenário | Risco a verificar |
| --- | --- | --- | --- | --- |
| Lançamento de SKU | Briefing → produto disponível em todos os canais | Tarefas, ERP, planilha e e-commerce | Checklist parcial; mudanças por mensagem | Data comercial anteceder liberação de qualidade/estoque |
| Campanha DTC | Meta e oferta → campanha ativa | Tarefas, mídia, e-commerce e ERP | Briefing padrão; aprovação de margem dispersa | Oferta aprovada sem reserva de estoque |
| Reposição | Sinal de ruptura → pedido recebido | ERP + planilha de previsão | Regras tácitas por SKU | Dependência da analista sênior para ajustar previsão |
| Pedido B2B | Proposta → faturamento/entrega | CRM + ERP | Condições comerciais por canal; exceções sem campo obrigatório | Desconto ou prazo sem verificação de margem e caixa |
| Exceção de atendimento | Chamado → solução e causa registrada | Help desk + ERP | Guia de respostas; causa em texto livre | Repetição do mesmo motivo sem ação corretiva |

## Amostra fictícia de registros de trabalho

| ID | Data | Fato registrado | Fonte simulada | Limite |
| --- | --- | --- | --- | --- |
| T-101 | 09/09 | Campanha de creatina aguardou confirmação de estoque por 2 dias úteis | Card de campanha | Não informa quando o pedido de confirmação foi enviado |
| T-118 | 18/09 | Mudança de arte do rótulo chegou após o agendamento de lançamento | Checklist de SKU | Não identifica a causa da mudança |
| T-136 | 03/10 | Promoção foi replanejada após margem projetada abaixo do piso | Card + planilha | Não há aprovação anexada |
| T-149 | 11/10 | Reposição de proteína vegetal dependeu de ajuste manual da previsão | Planilha de demanda | Não prova que uma pessoa única causou o atraso |
| T-171 | 24/10 | Atendimento repetiu 18 chamados por divergência de prazo informado | Help desk | A amostra não separa canal ou gravidade |

## Características das ferramentas

O ERP é a fonte de pedidos e saldo, mas a previsão comercial é mantida em planilha. O card de lançamento não possui campos obrigatórios de data de liberação, evidência de aprovação de margem e responsável pela promessa comercial. A ferramenta de tarefas não está ligada ao CRM B2B. A integração possível é uma hipótese de desenho para depois do diagnóstico.

**Validação pendente:** exportar cards originais e metadados de criação/alteração; confirmar se as cinco ocorrências representam frequência ou casos isolados.
