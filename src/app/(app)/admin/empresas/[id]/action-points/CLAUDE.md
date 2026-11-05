# Action Points da empresa no superadmin

A rota apresenta os Action Points cadastrados pelo consultor por líder do Slack, com criação e edição em painel lateral. Exige ativo publicado da própria empresa e instalação Slack conectada. O registro manual aparece na página principal de Action Points do cliente, sem ativar o agente nem alterar a publicação de uma entrega. Ações já publicadas em entregas continuam em uma seção separada, agrupadas pelo responsável atual, com link para o acordo operacional existente. Exige sessão definitiva de superadmin e carrega dados no servidor após `connection()`.

O botão `Enviar pergunta no Slack` inicia um ciclo manual de acompanhamento por ação. O histórico do último ciclo distingue proposta de resumo e relato confirmado pelo líder, ambos vindos da thread do Slack. Nenhum relato confirma conclusão por conta própria.
Depois de um envio confirmado, `Enviar nova pergunta` pode iniciar outro teste sem esperar resposta. Cada teste abre sua própria thread; envios em preparação ou incertos continuam bloqueados.
