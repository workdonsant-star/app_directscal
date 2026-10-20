# Conclusão da recuperação

POST público recebe token de uso único e nova senha confirmada. Não aceita e-mail, empresa ou usuário como destino. Fonte do token é o fragmento do link, enviado pelo formulário no corpo HTTPS. Valida expiração, entrega aceita, membership, versão de sessão e credencial antes da transação. Sem login automático; sessões anteriores são revogadas e o usuário entra novamente.
