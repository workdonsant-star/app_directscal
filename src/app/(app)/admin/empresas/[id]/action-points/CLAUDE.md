# Action Points da empresa no superadmin

A rota apresenta os Action Points já publicados para a organização, agrupados pelo responsável atual. Lê o workspace administrativo de rotinas existente; não mantém um segundo cadastro nem altera a publicação. Quando há um acordo, mostra o ativo e a periodicidade; com vários, mostra a quantidade sem escolher arbitrariamente um acordo. Leva à rota operacional de rotinas. Exige sessão definitiva de superadmin e carrega dados no servidor após `connection()`.

O cadastro manual de Action Points recorrentes exige dias da semana e horário de Brasília. O botão Testar envio agora é explícito e não altera a agenda. Registros antigos sem dias/horário precisam ser editados para entrar no cron.
