# Action Points da empresa no superadmin

A rota apresenta os Action Points já publicados para a organização, agrupados pelo responsável atual. Lê o workspace administrativo de rotinas existente; não mantém um segundo cadastro nem altera a publicação. Quando há um acordo, mostra o ativo e a periodicidade; com vários, mostra a quantidade sem escolher arbitrariamente um acordo. Leva à rota operacional de rotinas. Exige sessão definitiva de superadmin e carrega dados no servidor após `connection()`.

## Teste do acompanhamento

A aba agrupa o cadastro manual por líder do Slack. Enviar pergunta no Slack inicia um ciclo por ação explícita; proposta de resumo e relato confirmado aparecem separadamente. O envio incerto não é repetido automaticamente.
