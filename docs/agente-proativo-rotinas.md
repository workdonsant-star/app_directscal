# Contatos proativos de rotina — A05

Implementação no código local e migrações no OMDx em 20/10/2026. Nenhuma política real ativada, mensagem enviada ou implantação executada nos testes. Esta etapa inicia contato; interpretação/confirmação de relatos e supervisão pertencem a A06/A07.

## Configuração e público

Operação da empresa > Rotinas > Configurar acompanhamento define setores ativos autorizados, dias de segunda a sexta, início/fim exclusivo da janela, fuso e limites por empresa/pessoa. Começa desativado, sem público implícito. Ativar exige instalação persistida com users:read, im:write e chat:write. Revisões são imutáveis, com motivo, ator global DirectScal, tentativa UUID e revisão esperada. Pausa da empresa é uma nova configuração desativada. Setores inativos são retirados da nova seleção, sem apagar o histórico.

Fusos disponíveis: São Paulo/Brasília, Manaus, Rio Branco e Fortaleza. O fuso da política rege o horário dos contatos; o período acordado da rotina continua em America/Sao_Paulo. Dias de contato não substituem a cadência de execução. Limites iniciais do formulário são dez por empresa e um por pessoa/dia; não entram em vigor sem salvar a autorização.

## Oportunidades periódicas

O calendário gera somente o período corrente de um acordo autorizado, com abertura nunca anterior à regra ou à ativação da política. Não gera períodos anteriores automaticamente. Essa limitação deve ser considerada na recuperação de uma indisponibilidade que atravesse períodos inteiros: revisão operacional deve reconciliar oportunidades que não chegaram a ser abertas.

- Diária: uma oportunidade de segunda a sexta, abertura às 9h e prazo às 17h de São Paulo. O nome nas telas explicita segunda a sexta; feriados não são detectados automaticamente.
- Semanal: semana de segunda a domingo, com prazo domingo às 17h.
- Quinzenal: blocos contínuos de quatorze dias ancorados na segunda-feira de 06/01/2020; não são os dias 1/16 de cada mês.
- Mensal/trimestral/semestral/anual: limites de calendário, inclusive mês bissexto e virada de ano, prazo às 17h do último dia.

Estas convenções estão concretas para o piloto e devem ser revisadas no checklist A05. Não transformar cadência ou uma consulta em confirmação de execução. Oportunidade aberta permanece no denominador mesmo se um contato for cancelado; exclusão exige revisão explícita de exceção.

Uma chave por rotina/período evita duplicação entre tentativas e revisões. Criar oportunidade e contato ocorre na mesma transação. Publicação selecionada, atribuição, setor, pausa e versão vigente do ativo são revalidados. Nova versão do documento exige revisar o acordo antes de novas oportunidades/contatos; não há migração silenciosa da versão da prática.

## Por evento

Rotina por evento não ganha oportunidade por passagem do tempo. Registrar ocorrência exige operação global, regra e política esperadas, identificador estável da ocorrência, referência HTTPS, descrição, horário real e prazo no fuso da política. Evento futuro, anterior ao acordo ou com origem alterada é recusado. Uma oportunidade/contato/recibo são gravados atomicamente; mesma tentativa/ocorrência idêntica conserva os IDs, conteúdo divergente retorna conflito.

A ocorrência é atestação operacional com referência, não detecção automática de evento externo. Não busca nem executa o conteúdo do link informado. O recibo conserva origem, ator e regra para revisão. Salvar não chama Slack; o consumidor respeita a política antes de qualquer contato.

## Fila e envio

O agendador autenticado percorre até 25 rotinas por lote, com cursor persistido por rotina e marcador seguro de erro. Rotinas já verificadas ou com erro não monopolizam lotes seguintes. Cada oportunidade produz no máximo um contato inicial. Reentrada não duplica job nem ciclo; não depende de memória do processo.

O mesmo consumidor durável A15 atende contatos de rotina, com contexto próprio. Antes de preparar e imediatamente antes de despachar, revalida política/público, horário, cota, origem publicada, pessoa atribuída, instalação, pausa e versão vigente. Pessoa ativa é revalidada no Slack inclusive na recuperação de resposta preparada. Só abre DM dessa pessoa; não usa canal arbitrário do texto.

Fora da janela ou da cota, adia ao próximo início autorizado, liberando a reserva sem consumir tentativa de erro. Uma política nova faz contatos adiados serem reavaliados, sem antecipar Retry-After ou alterar envios incertos; salvar a política não bloqueia as linhas de envio. Uma reserva diária serializada pela empresa protege o limite mesmo com dois consumidores. A reserva conserva margem conservadora: falha confirmada também pode consumir a cota daquela tentativa, evitando contatos em excesso. Retry-After e limite final da A15 permanecem.

Resposta preparada persiste com o DM antes do envio. A confirmação grava timestamp/canal; timeout ou queda durante envio permanece Incerto e não é repetido automaticamente. Instalação revogada, pessoa removida, rotina pausada, público retirado, versão alterada ou ação despublicada cancelam o contato; ciclos anteriores não são apagados. Retomar libera oportunidades novas e não reabre automaticamente um contato cancelado do ciclo anterior.

A mensagem informa rotina, ativo/versão, expectativa, evidência, período e prazo de São Paulo. Texto de documentos/pessoas é escapado; destino nunca é escolhido por conteúdo recebido ou pelo modelo.

## Acionamento e recuperação

`POST /api/internal/routine-contacts` agenda o lote; `POST /api/internal/slack-deliveries` processa uma entrega. Ambos exigem segredo dedicado de pelo menos 32 caracteres, sem aceitar empresa/ator do payload. Sem configuração ficam fechados. Esta implementação não cria cron em produção; a implantação precisa ativar/monitorar os consumidores antes do piloto.

O contador ensured do agendador inclui contatos novos ou já existentes confirmados; não é o tamanho atual da fila. Recebido, falhou, incerto e concluído vêm da tabela de entrega. A API administrativa de metadados distingue consulta/rotina, ciclo e DM real, sem expor o texto da conversa.

Se a indisponibilidade atravessar períodos inteiros, não criar uma série retroativa presumida. A operação deve revisar as oportunidades perdidas e a evidência antes de qualquer recomposição. A06/A07 devem conservar esta distinção ao tratar relatos e silêncio.

## Evidências

SQL transacional com fixtures totalmente fictícias/ROLLBACK cobre política e papel, reentrada/conflito, oportunidade/contato únicos, janela/cota, adiamento sem gastar tentativa, pausa, revogação, ativo arquivado, versão antiga, cursor, eventos e falha injetada após criação do ciclo/job. A correção routine_event_contact_cycle_id eliminou um erro de referência ao UUID identificado pelo teste; repetição integral passou. Nenhum token utilizável ou mensagem é usado nas fixtures.

Unitários cobrem calendário/fuso, estado sem público, autenticação, campos forjados, limites, prova de evento, cursor avançando após falha, cancelamento entre preparo/envio e pessoa desativada na recuperação. Prova HTTP local confirmou política 200, cliente 403, payload sem público 400 e SSR administrativo 200 com entrada de configuração. Isso não é inspeção visual autenticada do painel global nem entrega real no Slack.

Ver também entrega-duravel-slack.md, modelo-de-aderencia.md e checklists A05/A15 no CRM. A integração mantém a stack HTTP/Supabase existente; nenhuma dependência/framework novo foi adicionado.


## Complemento A07 — lembrete limitado

A autorização de contatos também inclui um único lembrete por ciclo após 24 horas sem retorno, sempre sujeito à mesma janela/cota. Proposta, relato ou intervenção humana interrompe a cobrança; conversa recente na DM adia. Após 48 horas o silêncio é destacado na fila interna, sem mensagens repetidas ao gestor. Não há política real ativada nem cron configurado. Ver supervisao-e-escalonamento-rotinas.md.
