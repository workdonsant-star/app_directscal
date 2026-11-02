# Provedores de IA do superadmin

GET retorna somente modelo, origem e estado; nunca retorna chaves. POST consulta o modelo e gera uma resposta estruturada com fonte fictícia, sem gravar. PUT valida acesso ao modelo antes de salvar a chave cifrada e, opcionalmente, selecionar o motor para o agente de consulta. DELETE remove a configuração persistida; uma chave de ambiente continua disponível. Todas as operações exigem sessão definitiva de superadmin.
