# `/r/[token]` — Entrada pública Maturidade

## Propósito

Página pública para responder ao diagnóstico Maturidade a partir de um token real de `diagnostic_share_links`.

## Convenções locais

- Resolver o diagnóstico e o grupo pelo token salvo no Supabase.
- Mostrar introdução curta com navbar própria: logo Directscal, linha inferior em largura total e badge `Resposta anônima` com escudo.
- Não renderizar cards de metadados, escala ou anonimato no corpo da página; a confidencialidade fica concentrada no badge e no modal inicial.
- Renderizar o formulário Likert completo com as perguntas travadas do template Maturidade v1, em lista contínua e ordem aleatória por carregamento.
- O grupo organizacional vem sempre do token, nunca de seleção manual.
- Não coletar nome, e-mail, cargo ou qualquer outro identificador pessoal do respondente.
- Enviar respostas para `/api/omdx/responses` e manter uma trava leve em `localStorage` após sucesso.
- Ao abrir, exibir uma modal curta explicando como responder; ao tentar enviar incompleto, rolar até a primeira pergunta sem resposta e destacá-la em vermelho.
- Após o envio bem-sucedido, redirecionar para `/r/[token]/obrigado`.
- Quando o cookie de resposta já existir, redirecionar para `/r/[token]/obrigado` antes de renderizar o formulário.
- Tratar token inválido, expirado ou coleta encerrada com mensagem simples para o respondente.
