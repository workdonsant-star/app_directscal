# `src/lib/email` — E-mails transacionais

Integrações server-side para mensagens transacionais do produto.

## Convenções

- Nunca importar estes módulos em Client Components.
- O provedor atual é o Resend via API HTTP, sem expor `RESEND_API_KEY` ao navegador.
- Todo envio deve usar chave de idempotência ligada ao registro persistido que originou a mensagem.
- O remetente vem de `RESEND_FROM_EMAIL`; para destinatários reais, o domínio precisa estar verificado no Resend.
- Templates usam HTML inline compatível com clientes de e-mail e sempre incluem alternativa em texto puro.

