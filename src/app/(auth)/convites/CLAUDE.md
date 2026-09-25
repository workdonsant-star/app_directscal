# `/convites` — Convites públicos

Rotas públicas para revisar convites emitidos por uma empresa cliente.

## Convenções

- Nunca expor o token armazenado nem consultar pelo token bruto; usar SHA-256 no servidor.
- Convites expirados, revogados ou inexistentes compartilham o mesmo estado neutro.
- A revisão do convite mostra setor, cargo e nível de acesso, mas o membership só é criado depois da confirmação Google.
- A confirmação usa uma intenção OAuth curta em cookie `httpOnly`, aceita somente o e-mail exato do convite e captura nome/foto do perfil Google persistido pelo Auth.js.
- A sessão temporária não acessa o painel. O aceite transacional cria `organization_member` como `cliente` ou `admin`, limpa apenas o intent e reaproveita a sessão Google na entrada imediata em `/omdx`.
