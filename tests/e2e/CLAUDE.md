# Testes de navegador

Playwright usa o app local em :3000. Login demo exige AUTH_ENABLE_DEV_PASSWORD_LOGIN=true fora de produção. Não gravar credenciais de produção nem alterar contas reais nos testes.

profile-identity.spec.ts coloca nome e foto divergentes no localStorage antes da primeira leitura do perfil. Confere que formulário e sidebar mantêm a identidade autenticada em light/dark, sem importar os dados antigos. Não grava perfil nem usa cadastros reais.
