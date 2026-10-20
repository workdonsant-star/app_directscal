# Identidade entre app e Slack — A09

A implementação concilia duas contas somente após prova de posse dos canais. Não usa nome, foto ou aproximação textual. Não concede permissões, cria usuários ou envia convites.

## Fluxo

1. A pessoa entra com sua conta definitiva da empresa e abre Perfil > Identidade no Slack.
2. Gerar código produz 256 bits aleatórios, válidos por dez minutos. Só o SHA-256 persiste no desafio; o código fica na resposta sem cache e na memória da tela. Novo código revoga os anteriores não consumidos; intervalo mínimo de trinta segundos limita geração.
3. A própria pessoa envia `vincular <código>` em DM ao bot do workspace correto. Não publicar em canal ou compartilhar com outra pessoa.
4. O webhook valida assinatura e persiste evento na fila. Antes de chamar o agente, o processador revalida a pessoa no Slack e consome o desafio usando o lease do evento. Empresa, workspace e user ID vêm do evento autorizado e da instalação ativa.
5. A confirmação vincula uma conta a uma pessoa Slack dentro da empresa, conserva prova do evento e devolve confirmação pela fila durável. Mesmo evento reentrante é idempotente; outro evento não reutiliza o código. Conflitos de identidade não transferem controle de uma conta à outra.
6. A pessoa usa Verificar confirmação no perfil. Desvincular tem confirmação explícita, remove o vínculo atual e revoga desafios; conversas e prova anteriores permanecem.

Contas temporárias, sem JWT/membership e superadmin global não iniciam o vínculo. O comando não vai ao agente nem conta como consulta aos ativos. Sem instalação persistida ativa, não confirma. Remoção de membership ou revogação da instalação deixa de fornecer vínculo para os indicadores. A prova nunca libera acesso por si só.

## Indicadores

A fonte consulta vínculos comprovados da mesma organização e os entrega ao helper de população existente. Uma pessoa que consulta pelo app e pelo Slack conta uma vez. Apenas referências elegíveis entram na população; links não cadastram pessoas nem aumentam a base. Pendências de conciliação e consultas de pessoa desconhecida mantêm a adoção sem percentual, com motivo explícito. Cobertura/utilidade continuam calculadas de consultas reais. Não converter consulta ou identidade em cumprimento de rotina, aderência ou resultado.

A comparação temporal usa a população e os vínculos atuais nos dois períodos, conforme indicação existente. Ela não reconstrói automaticamente o quadro histórico de pessoal.

## Evidências e limites

Migração aplicada ao OMDx. SQL transacional de fixtures fictícias com ROLLBACK cobre isolamento, reentrada, lease, validade, conflitos, remoção de acesso e revogação. Testes unitários cobrem autorização, hash, próprio status, payload forjado, erro seguro, deduplicação e desvio do comando antes do modelo. Nenhuma identidade real foi vinculada e nenhuma mensagem foi enviada pelos testes.

Perfil inicial sem vínculo verificado no Chrome normal autenticado, desktop em claro/escuro; tema original restaurado e aba fechada. Capturas a09-identidade-claro.png e a09-identidade-escuro.png na pasta de evidências. Estados de código/confirmado/desvinculação têm verificação de contrato/SQL, mas ainda precisam de piloto visual interativo completo. A revisão em produção exige implantação das rotas e consumidor da fila A15.

Retenção/finalidade e público de leitura permanecem na A16. Não copiar códigos, hashes, tokens ou mensagens pessoais para CRM/logs. Checklist de piloto fica na A09: gerar no próprio perfil, enviar em DM no workspace de teste, conferir confirmação e contagem única, testar expiração e desvinculação.
