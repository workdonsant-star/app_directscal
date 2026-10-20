# Acesso e recuperação de conta — A14

Implementação local de 20/10/2026; migrações aplicadas ao banco conectado. Não houve deploy, e-mail real, troca de senha real ou aceite de OAuth em navegador nesta entrega.

## Métodos e autorização

Cliente/admin com credencial existente pode recuperar e trocar a própria senha. Conta somente Google continua pelo Google. Recuperação pública não provisiona senha para Google-only e não atende superadmin global. Resposta de solicitação é genérica para e-mail conhecido, desconhecido, Google-only e limite de emissão; falha de banco/configuração informa indisponibilidade.

Sessão Auth.js revalida membership e versão a cada requisição. Troca de credencial e remoção/alteração de membership invalidam a versão anterior. JWT RLS inclui versão e dura até cinco minutos. A proteção direta de versão no banco está preparada, mas `session_security_enforcement.enabled` permanece false: ativar antes do deploy compatível invalidaria sessões emitidas pelo código antigo.

## Recuperação durável

Solicitação, token com hash e outbox são persistidos antes de confirmar a solicitação. Token de 256 bits, validade de uma hora, uso único, vinculado ao usuário/versão/e-mail; novo pedido revoga o anterior. Outbox guarda envelope AES-GCM derivado do segredo do app, com contexto e URL vinculados. Nenhum token puro no banco ou log.

Mensagem usa URL pública canônica, HTTPS em produção, sem depender do Host recebido. Código vai no fragmento `#codigo`; a página o remove do histórico e mantém somente em memória. Conclusão troca hash e versão na mesma transação, sem autenticar automaticamente. Troca no perfil exige senha atual, limita tentativas e encerra sessão após sucesso.

Primeira tentativa ocorre após a resposta; consumidor interno exige `PASSWORD_RESET_WORKER_SECRET` dedicado. Reserva exclusiva de dois minutos, cinco tentativas, Retry-After e mesma chave de idempotência por solicitação. Aceite do provedor não significa entrega na caixa de entrada.

## Cadastro público isolado

Foi identificada reutilização insegura da organização por nome/domínio informados publicamente. A RPC `complete_acquisition_account` agora cria uma organização nova; colisão de domínio não concede acesso à anterior. Usuário, membership, credencial, lead e recibo são atômicos. Senha exige conta inteiramente nova; não sobrescreve senha existente. Google exige identidade/e-mail exatos; reentrada depende de recibo, payload idêntico e membership vigente. Lead antigo não restaura acesso removido.

Essa correção exige deploy do código local. Migração aplicada não modifica o comportamento do aplicativo ainda publicado.

## Operação e liberação

1. Implantar código compatível, incluindo isolamento do cadastro público; verificar login Google/senha, convite e reentrada.
2. Configurar URL canônica, remetente verificado, provedor e segredo do app com pelo menos 32 caracteres. Manter rastreamento de abertura/cliques desativado no domínio transacional para não alterar o link sensível (configuração do provedor, não realizada aqui).
3. Configurar consumidor periódico e monitorar falhas/idade da fila. A chave interna deve ser distinta da chave de uso público. Não reemitir token para recuperar tentativa transitória; reutilizar a mesma entrega/idempotência.
4. Autorizar destinatário piloto e verificar caixa de entrada/spam, link expirado/usado/substituído e novo login. Não confundir ID aceito pelo Resend com confirmação de recebimento.
5. Após deploy compatível, ativar enforcement de versão em mudança controlada e provar rejeição de JWT antigo pelo RLS. Verificar remoção/alteração de papel, logout e contas em dois navegadores.
6. Aceitar visual em claro/escuro e público em 375px; testar Google-only, senha atual incorreta/correta e retomada de onboarding incompleto.
7. Retenção/limpeza de solicitações e tentativas permanece dependente de decisão A16. Não há rotina de expurgo aprovada nesta entrega.

## Evidência

82 arquivos / 488 testes unitários aprovados; TypeScript, lint e build aprovados. SQL fictício com ROLLBACK passou para recuperação e aquisição atômicas. HTTP local confirmou recuperação e perfil 200, ausência de texto de senha simulada, payload de senha forjado 400, e-mail inválido 400 e JWT versionado de curta duração. Sem mutação/e-mail nessas requisições. Enforcement no banco conferido false. Navegador, e-mail real e produção continuam pendentes.
