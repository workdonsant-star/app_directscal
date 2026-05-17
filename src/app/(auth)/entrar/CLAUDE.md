# `/entrar` — Entrada

Tela pública para autenticar usuários no OMDx. Usa `SignInForm`, mostra e-mail/senha como primeiro caminho quando o login real de superadmin ou o fallback dev estiver habilitado, e oferece Google OAuth como opção corporativa. Usuários autenticados redirecionam conforme role: `superadmin` para `/admin/modulos`, demais para `/omdx`.

Erros de acesso do Auth.js chegam por query string e devem ser traduzidos em copy curta em pt-BR.
