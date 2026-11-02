# `/entrar` — Entrada

Tela pública para autenticar usuários no Maturidade. Usa `SignInForm`, mostra Google como primeiro caminho e, quando Supabase estiver configurado ou o fallback dev estiver habilitado, oferece e-mail/senha após o divisor. Usuários autenticados redirecionam conforme role: `superadmin` para `/admin/empresas`, demais para `/omdx`.

Erros de acesso do Auth.js chegam por query string e devem ser traduzidos em copy curta em pt-BR.

O painel visual da tela usa a variante `visualVariant="login"` de `AuthPageShell`, conforme o frame Figma `304:123`: coluna de 42,5% à esquerda, logo Directscal no topo, formulário de até `396px` com controles de `45px` e painel fotográfico à direita. O painel usa uma única imagem fixa em `public/auth/login-collage/background.png`, fornecida pelo usuário, com o depoimento e avatar sobrepostos. O formulário segue o tema claro ou escuro resolvido pelo `ThemeProvider`, cujo padrão é o sistema da pessoa. Em telas menores que `lg`, o painel fotográfico é ocultado e o formulário ocupa a largura disponível.

O logo desta variante usa `logo-primary.svg` no tema claro e `logo-primary-dark.svg` no escuro, com largura de `134px` e altura proporcional de `18px`.
