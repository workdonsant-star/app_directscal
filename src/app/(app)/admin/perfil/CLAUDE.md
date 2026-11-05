# `/admin/perfil` — Perfil do superadmin

Página pessoal do superadmin global, acessível pelo menu do usuário. Herda a autorização de `admin/layout.tsx`, usa o shell administrativo e não exibe breadcrumb. Nome, e-mail e foto vêm da sessão hidratada; somente nome e foto são editáveis. O formulário reutiliza o recorte circular do perfil do cliente e salva por `PUT /api/profile`, que deriva o ID da sessão e grava em `account_profiles`. Não carrega dados empresariais, Slack ou senha do cliente.
