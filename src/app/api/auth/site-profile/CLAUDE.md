# Perfil no site público

`GET /api/auth/site-profile` permite que o site reconheça a sessão já existente no app, no mesmo navegador. Reutiliza `getCurrentAuthSession`, incluindo o perfil persistido; não altera cookies nem cria outra autenticação.

- Somente Origins exatas `https://directscal.com` e `https://www.directscal.com`; ausência de Origin, localhost, previews e demais domínios são recusados antes de consultar a sessão.
- CORS com credenciais, nunca wildcard. OPTIONS permite apenas GET/OPTIONS. Não ampliar CORS nas demais rotas de autenticação.
- Retorna somente `{ user: { name, avatarUrl } }`; nunca expor ID, e-mail, empresa, papel ou tokens. Avatar mantém o formato já suportado pelo perfil (HTTPS, caminho no app ou data URL raster).
- Sem sessão, sessão expirada ou intent temporário de aquisição/convite: `{ user: null }`. Falha interna: 503 com o mesmo corpo neutro.
- Todas as respostas têm `Cache-Control: private, no-store, max-age=0` e `Vary: Origin, Cookie`.
- O Website consulta com `credentials: include`; mostra iniciais quando não há foto, restaura Acessar App quando deslogado/indisponível e revalida ao voltar para a página e a cada minuto visível. Não persiste identidade no navegador.
- Publicar app antes do Website. Validar nos dois domínios HTTPS oficiais com login real: foto, troca/remoção, saída, desktop e mobile. Testes com sessão substituída não comprovam implantação nem login real.
