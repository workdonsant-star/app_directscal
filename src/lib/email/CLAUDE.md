# `src/lib/email` — E-mails transacionais

Integrações server-side para mensagens transacionais do produto.

## Convenções

- Nunca importar estes módulos em Client Components.
- O provedor atual é o Resend via API HTTP, sem expor `RESEND_API_KEY` ao navegador.
- Todo envio deve usar chave de idempotência ligada ao registro persistido que originou a mensagem.
- O remetente vem de `RESEND_FROM_EMAIL`; para destinatários reais, o domínio precisa estar verificado no Resend.
- Templates usam HTML inline compatível com clientes de e-mail e sempre incluem alternativa em texto puro.



A14: password-recovery-email exige remetente/provedor, URL pública canônica HTTPS e segredo >=32 caracteres. Não derive URL de Host do request. Link usa fragmento para não enviar código no GET/referrer; HTML inline + texto, timeout de 15s, idempotência por solicitação e classificação de Retry-After. Aceite do provedor não comprova entrega na caixa de entrada.
