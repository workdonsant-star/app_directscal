# Configuração inicial do cliente

`/onboarding` fica fora do shell `(app)` e exige sessão regular `cliente`. Superadmin global e admins convidados seguem para suas superfícies. A empresa vem do membership da sessão.

Etapas: conectar Slack, cadastrar setores com liderança no drawer existente e revisar o envio dos convites. Aceite Google posterior não bloqueia conclusão. O servidor valida Slack com os escopos de Action Points e todos os setores ativos antes de persistir conclusão por empresa. A navegação normal permanece bloqueada no layout `(app)` até essa gravação; logout e tema estão disponíveis.

O progresso intermediário vem das instalações e setores persistidos, sem cookie/localStorage. Conclusão é durável em `app_private.client_onboarding_completions`; desconexão posterior não reabre onboarding. Não representa uma nova fronteira de autorização das APIs do produto.

Sessões temporárias de aquisição e convite são promovidas pelo callback JWT para sessão regular assim que existe membership no banco. A promoção limpa ambos os flags antes de acessar o onboarding, evitando o ciclo `/omdx` → `/onboarding` → `/entrar` → `/omdx`; sessões ainda sem membership mantêm o intent temporário.
