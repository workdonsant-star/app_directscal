# Recuperação de senha

POST valida e-mail estrito, persiste solicitação/outbox e responde genericamente. after() tenta a entrega inicial sem substituir o consumidor durável. complete recebe token/nova senha e confirma atomicamente; códigos nunca em logs. Ver src/lib/auth/CLAUDE.md.
