# Consumidor de recuperação

POST processa no máximo um e-mail de recuperação. Exige PASSWORD_RESET_WORKER_SECRET dedicado com ao menos 32 caracteres e comparação constante. Usa outbox criptografada, lease e idempotência do Resend; nunca aceita destinatário, token ou usuário do payload. Fechado por padrão, sem agendamento externo criado pela implementação.
