# `/r/[token]` — Entrada pública OMDx

## Propósito

Página pública para responder ao diagnóstico OMDx a partir de um token real de `diagnostic_share_links`.

## Convenções locais

- Resolver o diagnóstico e o grupo pelo token salvo no Supabase.
- Mostrar introdução curta, confidencialidade e tempo estimado.
- Renderizar o formulário Likert completo com as perguntas travadas do template OMDx v1.
- O grupo organizacional vem sempre do token, nunca de seleção manual.
- Não coletar nome, e-mail, cargo ou qualquer outro identificador pessoal do respondente.
- Enviar respostas para `/api/omdx/responses` e manter uma trava leve em `localStorage` após sucesso.
- Após o envio bem-sucedido, redirecionar para `/r/[token]/obrigado`.
- Quando o cookie de resposta já existir, redirecionar para `/r/[token]/obrigado` antes de renderizar o formulário.
- Tratar token inválido, expirado ou coleta encerrada com mensagem simples para o respondente.
