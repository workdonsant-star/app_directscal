# Testes de navegador

Playwright usa o app local em :3000. Login demo exige AUTH_ENABLE_DEV_PASSWORD_LOGIN=true fora de produção. Não gravar credenciais de produção nem alterar contas reais nos testes.

profile-identity.spec.ts coloca nome e foto divergentes no localStorage antes da primeira leitura do perfil. Confere que formulário e sidebar mantêm a identidade autenticada em light/dark, sem importar os dados antigos. Não grava perfil nem usa cadastros reais.


A18: expectativas atuais usam Pesquisas/Analytics/Action Points, sem exigir bibliotecas/títulos seed na sidebar. Casos demo (incluindo identidade) exigem DIRECTSCAL_E2E_DEMO=true em ambiente isolado. password-recovery cobre renderização pública light/dark em 1440/375, sem enviar e-mail. pilot-read-boundaries usa storage states de login normal fornecidos por ambiente e IDs de fixtures; não injeta cookie privilegiado. Falta de configuração é não execução, nunca aprovação. Sessões não entram no Git. Execução visual desta entrega bloqueada pela conexão Chrome indisponível.
