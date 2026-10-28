# Testes de navegador

Playwright usa o app local em :3000. Login demo exige AUTH_ENABLE_DEV_PASSWORD_LOGIN=true fora de produção. Não gravar credenciais de produção nem alterar contas reais nos testes.

Analytics, revisão de 26/10/2026: a suíte C1 espera régua da média e respostas por nível no primeiro bloco, sem exigir instrumento visível. Os parágrafos metodológicos não pertencem mais a esse resumo.

C1: password-recovery verifica também fragmento removido com formulário utilizável, link malformado, resposta de link vencido e falha de solicitação preservando campos. As requisições desses cenários são interceptadas no navegador; não comprovam entrega externa ou alteração real de senha.

profile-identity.spec.ts coloca nome e foto divergentes no localStorage antes da primeira leitura do perfil. Confere que formulário e sidebar mantêm a identidade autenticada em light/dark, sem importar os dados antigos. Não grava perfil nem usa cadastros reais.


A18: expectativas atuais usam Pesquisas/Analytics/Action Points, sem exigir bibliotecas/títulos seed na sidebar. Casos demo (incluindo identidade) exigem DIRECTSCAL_E2E_DEMO=true em ambiente isolado. password-recovery cobre renderização pública light/dark em 1440/375, sem enviar e-mail. pilot-read-boundaries usa storage states de login normal fornecidos por ambiente e IDs de fixtures; não injeta cookie privilegiado. Falta de configuração é não execução, nunca aprovação. Sessões não entram no Git. Execução visual desta entrega bloqueada pela conexão Chrome indisponível.

C2: cycle-two.spec.ts usa a rota temporária descrita em fixtures/CLAUDE.md e intercepta todas as APIs. Verifica atribuição com erro, fila de revisão, RACI preservada, leitor/guia e recuperação Slack em dois temas. Não comprova banco, autenticação, modelo ou envio real.

C3: cycle-three.spec.ts cobre a operação de rotinas com fixtures (ver fixtures/CLAUDE.md). APIs interceptadas; nenhuma mutação de banco ou envio Slack. Conflitos e erros devem preservar campos, sem liberar responsáveis fora do diretório ou nova mutação após gravação sem releitura.
