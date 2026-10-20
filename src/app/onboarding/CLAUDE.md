# Configuração inicial do cliente

`/onboarding` fica fora do shell `(app)` e exige sessão regular `cliente`. Superadmin global e admins convidados seguem para suas superfícies. A empresa vem do membership da sessão.

Etapas: conectar Slack, selecionar pessoas do Slack, informar o setor e revisar as lideranças. Cargo é opcional e aproveita o perfil Slack. Não cria conta no painel nem envia convites; liderança atua somente no Slack. O servidor valida Slack com os escopos de Action Points e todos os setores ativos antes de persistir conclusão por empresa. A navegação normal permanece bloqueada no layout `(app)` enquanto `requiresOnboarding` for verdadeiro; logout e tema estão disponíveis.

O progresso intermediário vem das instalações e setores persistidos, sem cookie/localStorage. Conclusão é durável em `app_private.client_onboarding_completions`; desconexão posterior não reabre onboarding. Não representa uma nova fronteira de autorização das APIs do produto.

Sessões temporárias de aquisição e convite são promovidas pelo callback JWT para sessão regular assim que existe membership no banco. A promoção limpa ambos os flags antes de acessar o onboarding, evitando o ciclo `/omdx` → `/onboarding` → `/entrar` → `/omdx`; sessões ainda sem membership mantêm o intent temporário.

A decisão de entrada usa `requiresOnboarding`, derivada no servidor: conclusão persistida ou instalação Slack ativa da própria empresa dispensam o onboarding inteiro. Sem ambos, a preparação é obrigatória. Conexão de outra empresa não libera acesso. A conclusão explícita continua revalidando setores e lideranças; dispensar a tela não grava conclusão nem transfere workspace.
