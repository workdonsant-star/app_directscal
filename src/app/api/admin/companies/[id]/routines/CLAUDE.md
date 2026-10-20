# API de rotinas da operação

Exige sessão definitiva superadmin antes de ler payload ou chamar dados/Slack. Empresa é derivada da rota e ator da sessão. GET lê workspace; directory=1 consulta somente o diretório ativo da mesma empresa. POST valida união estrita de salvar, transferir e situação. Nomes/fotos/team ID vêm do servidor. Escritas são RPCs atômicas com revisão esperada e UUID de tentativa; conflito preserva o texto na interface. Sem envio de mensagens ou ampliação de acesso ao painel.
