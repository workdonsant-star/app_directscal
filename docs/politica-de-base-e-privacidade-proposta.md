# Base, transparência e retenção — proposta A16

Estado: proposta para revisão do responsável pelo produto. Estes parâmetros ainda não são política aprovada nem autorização para apagar dados. A regra operacional atual permite análise com uma resposta; não representa garantia de anonimato de grupos pequenos.

## Decisões para revisão

| Tema | Proposta inicial | Efeito que precisa ser confirmado |
| --- | --- | --- |
| Time e liderança | Exibir leituras agregadas somente com ao menos cinco respostas na camada/recorte | Menos de cinco: mostrar base insuficiente, sem score, distribuição, texto que permita inferir resposta, exportação ou consulta indireta. O limiar vale por pergunta e recorte, não somente pelo total da pesquisa. |
| Fundador | Tratar como percepção identificável, distinta da coleta anônima | Uma resposta só aparece ao próprio fundador/dono e ao especialista autorizado para a entrega; não prometer anonimato dessa camada. Confirmar se administradores de setor podem ver essa leitura. |
| Cruzamentos | Aplicar a mesma proteção em setor, período, dimensão, pergunta, PDF, CSV e contexto do agente | Impedir recuperar grupo pequeno por subtração entre total e outro recorte. Filtros e downloads não podem contornar a proteção. |
| Evidência de rotina | Identificada e operacional, separada da pesquisa anônima | Responsável vê a própria rotina; gestor autorizado vê execução agregada e bloqueios necessários; operação DirectScal vê evidência para revisar. Conversas completas não entram automaticamente na visão de todos. |
| Consulta aos ativos | Usar identidade para conciliar adoção, com transparência | Adoção não é produtividade nem cumprimento de rotina. Desvincular interrompe a conciliação; não apagar auditoria por efeito colateral. |
| Mensagens privadas | Guardar somente o contexto necessário ao serviço, em schema privado | Alertas e filas operacionais mostram metadados/causa, sem publicar a conversa. Acesso excepcional precisa de motivo e rastreabilidade. |
| Códigos temporários | Validade de dez minutos; invalidar em uso, nova geração ou desvinculação | Nunca logar código nem expor hash no CRM. Proposta: limpar desafios expirados sem vínculo após trinta dias; conservar prova mínima enquanto houver vínculo vigente. |
| Perguntas/respostas e transporte | Proposta de retenção operacional de noventa dias para texto da conversa e trinta dias para payload de transporte resolvido | Antes de executar, confirmar necessidade comercial e de suporte, públicos, recuperação e tratamento de casos pendentes. A prova mínima de entrega e agregados podem ter política distinta. |
| Pesquisa e publicação | Proposta de doze meses após encerramento do contrato, com revisão das necessidades de histórico | Confirmar retenção, portabilidade, exclusão e responsável pela solicitação. Nenhuma limpeza de pesquisa está autorizada por este documento. |
| Transparência | Aviso antes da coleta e antes do acompanhamento identificado | Explicar finalidade, distinção entre anonimato e rotina identificada, público de cada leitura e canal para solicitar correção/desvinculação. Texto definitivo depende da aprovação do responsável. |

Os prazos são opções para dimensionar a operação, não conclusões jurídicas. Não foram executados expurgos ou alterações do limiar em produção.

## Implementação depois das decisões

Persistir versão da política, empresa, aprovador e data; aplicar a mesma regra no servidor antes de montar DTO, PDF/CSV ou contexto do agente. A interface não pode ser a única barreira. Guardar a versão da política usada em cada publicação. Retenção precisa de execução limitada, rastreável, recuperável quando aplicável e sem remover referências necessárias à prova vigente. Casos sem decisão permanecem sem estimativa nova; não transformar ausência de política em consentimento.

## Aceite e verificação

- Uma pessoa em camada anônima não produz leitura individual, inclusive por filtros, subtração, download e agente.
- Uma rotina identificada não se mistura às respostas anônimas do diagnóstico.
- Cliente, admin de setor, especialista e operação recebem somente o público aprovado.
- Pausa/revogação/desvinculação não apagam ou reatribuem prova histórica.
- Expiração do código não concede vínculo; remoção de membership/instalação impede conciliação.
- Retenção conserva justificativa e execução; não há expurgo automático antes da aprovação dos parâmetros.

A03, A13, A15 e A09 já conservam separação de fatos, respostas anônimas transacionais, fila privada e prova de identidade. Isso não substitui o fechamento da política de público/agregação/retenção. A16 permanece bloqueada para estas decisões, com implementação de enforcement explicitamente pendente depois da revisão.
