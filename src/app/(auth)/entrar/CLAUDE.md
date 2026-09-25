# `/entrar` — Entrada

Tela pública para autenticar usuários no Maturidade. Usa `SignInForm`, mostra Google como primeiro caminho e, quando o login real de superadmin ou o fallback dev estiver habilitado, oferece e-mail/senha após o divisor. Usuários autenticados redirecionam conforme role: `superadmin` para `/admin/operacao`, demais para `/omdx`.

Erros de acesso do Auth.js chegam por query string e devem ser traduzidos em copy curta em pt-BR.

O painel visual da tela usa a variante `visualVariant="app"` de `AuthPageShell`: formulário em coluna branca à esquerda, logo Directscal no topo e painel lateral à direita com o mesh gradient Bloom Field animado, depoimento e avatar. A composição preserva a largura do formulário próxima de `396px`, controles de `45px` e divisor com "ou"; o visual usa White `#FFFFFF`, Matcha `#ADE316`, Violet `#7D1AFF` e Lapis `#1A48EF`, centralizados em tokens globais e sem hex local no componente.
