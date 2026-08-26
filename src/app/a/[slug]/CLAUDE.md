# `/a/[slug]` — Link de aquisição

## Propósito

Página pública que inicia o cadastro de cliente final a partir de uma campanha de aquisição.

## Convenções locais

- Slug inválida mostra estado simples de erro.
- Campanha pausada mostra estado simples, sem formulário.
- O formulário reflete campos editados pelo superadmin e persistidos no Supabase.
- Na etapa de e-mail, os campos de campanha aparecem em blocos com até três campos, progresso, avanço automático somente quando todo o bloco estiver válido e um único botão para voltar; não renderizar a lista inteira verticalmente.
- Ao concluir o campo CNPJ, consultar a API interna de aquisição, preencher a razão social registrada e só então avançar. Não exibir campo manual de nome da empresa.
- A primeira tela mostra apenas os métodos de acesso. Google cria intent, limpa sessão Auth.js anterior e redireciona para completar dados da empresa; a etapa de e-mail concentra os dados da campanha e senha.
- Erros controlados do callback Google voltam para esta rota via `erro` e devem ser exibidos no estado inicial do formulário, sem depender da tela genérica de login.
- Usuários criados por esta rota sempre entram como `cliente` e são enviados para `/omdx`.
- Escolha de método, cadastro por e-mail e estados indisponíveis usam o mesmo `AuthPageShell` de `/entrar`; não reintroduzir o vídeo líquido ou um shell paralelo nesta rota.
