# `/entrar` — Entrada

Tela pública para autenticar usuários no Maturidade. Usa `SignInForm`, mostra Google como primeiro caminho e, quando o login real de superadmin ou o fallback dev estiver habilitado, oferece e-mail/senha após o divisor. Usuários autenticados redirecionam conforme role: `superadmin` para `/admin/modulos`, demais para `/omdx`.

Erros de acesso do Auth.js chegam por query string e devem ser traduzidos em copy curta em pt-BR.

O painel visual da tela usa a variante `visualVariant="app"` de `AuthPageShell`: formulário em coluna branca à esquerda, logo Directscal no topo e painel lateral à direita com gradiente animado, depoimento e avatar. A composição segue o frame Figma `/entrar — login desktop`: largura do formulário próxima de `396px`, controles de `45px`, divisor com "ou" e paleta de gradiente `#7E1AFF` + `#ADE517` centralizada em tokens globais, sem hex local no componente.
