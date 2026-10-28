# Roteiro de validação — ciclo 2

## Contexto

Use uma empresa de teste autorizada, um especialista de teste e documentos sem dados de clientes. O painel administrativo exige conta global DirectScal; o leitor e o agente exigem uma conta cliente da mesma empresa. A demo isolada não substitui essas sessões.

Guias de produto: `/admin/guia` para operação (entrada no detalhe da empresa) e `/docs` para cliente (entrada pelo Guia de uso do agente). Endereços relativos referem-se ao ambiente que estiver sendo validado, não comprovam publicação.

## Revisão de interface disponível localmente

1. Em Empresas, abrir a empresa de teste, selecionar Especialista principal e Salvar atribuição. Verificar a confirmação e reabrir em outra sessão. O contato de uma publicação antiga deve continuar sendo o do especialista atribuído a ela.
2. Abrir Criação dos ativos e o filtro Revisão vencida. Conferir responsável e prazo; documento sem periodicidade não deve ganhar data. A matriz RACI deve apresentar atividades e papéis R/A/C/I editáveis.
3. No leitor do cliente, localizar Consultar agente na barra superior e Baixar MD no documento.
4. No detalhe administrativo da empresa, consultar Entregas no Slack. Verificar os estados e os horários de Brasília. Incerto não oferece reenvio; Falhou com tentativa automática mostra a janela; falha sem recuperação automática permite confirmação após corrigir a causa.
5. Percorrer o guia correspondente ao papel e conferir se os nomes e links correspondem à navegação.

## Validação integrada ainda necessária

1. Criar SOP fictício na operação, salvar, revisar, aprovar e publicar. Abrir pelo cliente e conferir versão e conteúdo.
2. Editar a instrução em rascunho pela operação. O cliente deve continuar vendo a publicação anterior. Republicar e confirmar a atualização na leitura e na busca do agente.
3. Perguntar no app sobre a instrução nova; conferir fonte, versão e avaliação. Fazer pergunta sem orientação no acervo e distinguir recusa de erro técnico.
4. Em workspace/canal de teste explicitamente autorizado, repetir a pergunta pelo Slack e confirmar uma única resposta com fonte. Registrar evento, horário e confirmação sem copiar conversa pessoal ou segredo.
5. Com consumidor periódico implantado e monitorado, provocar falha antes do envio em ambiente de teste. Confirmar recuperação única; simular perda de confirmação e verificar Incerto sem duplicação.

O passo 4 envolve mensagem externa e exige destino autorizado. Nenhum envio real foi executado nesta rodada. O passo 5 depende do ambiente implantado; testes com substitutos não comprovam entrega real.

## O que pertence à operação técnica

Configurar/implantar consumidor e ambiente, manter segredos, testar permissões/concorrência e registrar versão/evidências. Don revisa a experiência e o conteúdo depois de receber o caminho pronto. Não transferir configuração de infraestrutura ao usuário como checklist de validação.
